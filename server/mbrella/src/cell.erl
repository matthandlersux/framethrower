-module (cell).

-behaviour(gen_server).

-compile(export_all).

-include("../include/scaffold.hrl").


% -ifdef( debug ).
% -define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
% -else.
% -define( trace(X), void ).
% -endif.
% -define(this(Field), State#cellState.Field).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).


-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).
-export ([
	makeCell/0, makeLinkedCell/0, makeCellLeashed/0, makeLinkedCellLeashed/0,
	sendElements/3,
	leash/1, unleash/1,
	injectOutput/2, injectOutput/3, uninjectOutput/2, uninjectOutput/3,
	injectIntercept/2
	]).
%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% 
%% create cells
%% 

makeCell() -> makeCell(unit).

makeCell(CellType) ->
	Name = "server" ++ integer_to_list(random:uniform(1000)),
	{ok, Pid} = gen_server:start(?MODULE, [CellType, {name, Name}], []),
	%Name = env:nameAndStoreCell(Pid),
	cellPointer:new(Name, Pid).
	
makeLinkedCell() -> makeLinkedCell(unit).

makeLinkedCell(CellType) ->
	{ok, Pid} = gen_server:start_link(?MODULE, [CellType], []),
	%Name = env:nameAndStoreCell(Pid),
	Name = "server" ++ integer_to_list(random:uniform(1000)),
	cellPointer:new(Name, Pid).

makeCellLeashed() -> makeCellLeashed(unit).

makeCellLeashed(CellType) ->
	{ok, Pid} = gen_server:start(?MODULE, [CellType, leashed], []),
	%Name = env:nameAndStoreCell(Pid),
	Name = "server" ++ integer_to_list(random:uniform(1000)),
	cellPointer:new(Name, Pid).

makeLinkedCellLeashed() -> makeLinkedCellLeashed(unit).

makeLinkedCellLeashed(CellType) ->
	{ok, Pid} = gen_server:start(?MODULE, [CellType, leashed], []),
	%Name = env:nameAndStoreCell(Pid),
	Name = "server" ++ integer_to_list(random:uniform(1000)),
	cellPointer:new(Name, Pid).

%% 
%% add/remove Elements
%% 

%% 
%% sendElements :: CellPointer -> CellPointer -> Elements -> ok
%% Elements :: List Tuple ("add" | "remove") Elements

sendElements(CellPointer, From, Elements) ->
	gen_server:cast(cellPointer:pid(CellPointer), {sendElements, From, Elements}).

%% ====================================================
%% PrimFun API
%% ====================================================

%create cell is defined above

leash(CellPointer) ->
	gen_server:cast(cellPointer:cellPid(CellPointer), leash).
	
unleash(CellPointer) ->
	gen_server:cast(cellPointer:cellPid(CellPointer), unleash).

%% 
%% inject output function 
%% 

injectOutput(CellPointer, OutputToCellPointer) ->
	injectOutput(CellPointer, OutputToCellPointer, outputs:standard()).
	
injectOutput(CellPointer, OutputToCellPointer, OutputFunction) ->
	gen_server:cast(
		cellPointer:pid(CellPointer), 
		{injectOutput, OutputToCellPointer, OutputFunction }
	).
	
%% 
%% uninjectOutput needs to pass all elements as {remove, Element} to all its outputs, process, and then
%%  most likely send all those removes down to the cell it was connected to
%% 

uninjectOutput(CellPointer, OutputToCellPointer) ->
	uninjectOutput(CellPointer, OutputToCellPointer, {send, undefined, []}).
	
uninjectOutput(CellPointer, OutputToCellPointer, OutputFunction) ->
	gen_server:cast(
		cellPointer:pid(CellPointer),
		{uninjectOutput, OutputToCellPointer, OutputFunction }
	).


%% 
%% inject intercept function
%% 

injectIntercept(CellPointer, InterceptPointer) ->
	gen_server:cast(
		cellPointer:pid(CellPointer),
		{injectIntercept, InterceptPointer}
	).


%% ====================================================
%% Debug API
%% ====================================================

getState(CellPointer) ->
	gen_server:call(cellPointer:pid(CellPointer), getState).

%% ====================================================
%% gen_server callbacks
%% ====================================================


%% 
%% init :: List Atom | EmptyList -> Tuple Atom CellState
%% Flags :: List Tuple Atom b 
%%			b :: leashed | unleashed | etc...
%% 

init([]) ->
	process_flag(trap_exit, true),
    {ok, cellState:new()};
init([Type]) when is_atom(Type) ->
	process_flag(trap_exit, true),
	{ok, cellState:new(Type)};
init([Type|Flags]) ->
	process_flag(trap_exit, true),
    {ok, cellState:new(Type, Flags)}.


handle_call(getState, _From, State) ->
	{reply, State, State};
handle_call(Msg, From, State) ->
    Reply = ok,
    {reply, Reply, State}.



handle_cast({injectIntercept, InterceptPointer}, State) ->
	Informants = intercepts:getArguments(InterceptPointer),
	Informants1 = cellPointer:filterList(Informants),
	State1 = cellState:updateInformants(State, Informants1),
	{noreply, cellState:injectIntercept(State1, InterceptPointer)};
	
handle_cast({sendElements, From, Elements}, State) ->
	State2 = 
		case cellState:getIntercept(State) of
			undefined ->
				NewElements = Elements,
				cellState:setDone(State, From);
			Intercept ->
				{InterceptState, NewElements} = intercepts:call(Intercept, From, Elements),
				State1 = cellState:updateIntercept(InterceptState),
				cellState:setDone(State1, From)
		end,

	%check if done
	IsDone = cellState:isDone(State2),
	
	case cellState:getFlag(State2, waitForDone) of
		true when IsDone =:= true ->
			FinalElementsMerged = cellState:mergeWithStash(State2, NewElements),
			{State3, FinalElements} = cellState:injectElements(State2, FinalElementsMerged),
			FinalState = runOutputs(State3, FinalElements),
			{noreply, FinalState};
		true ->
			NewState1 = cellState:updateStash(State2, NewElements),
			{noreply, NewState1};
		_ ->
			{State3, FinalElements} = cellState:injectElements(State2, NewElements),
			FinalState = runOutputs(State3, FinalElements),
			{noreply, FinalState}
	end;
	
handle_cast({injectOutput, OutputFunction, OutputTo}, State) ->
	link(cellPointer:cellPid(OutputTo)),
	NewState1 = cellState:injectOutput(State, OutputFunction, OutputTo),
	NewState2 = outputAllElements(NewState1, OutputFunction, OutputTo),
	{noreply, NewState2};
	
handle_cast(leash, State) ->
    {noreply, cellState:updateFlag(leash, true, State)};

handle_cast(unleash, State) ->
	{noreply, cellState:updateFlag(leash, false, State)}.

terminate(Reason, State) ->
    ok.

handle_info(Info, State) ->
    {noreply, State}.

code_change(OldVsn, State, Extra) ->
    {ok, State}.

%% ====================================================
%% Internal API
%% ====================================================

%% 
%% runOutputs :: CellState -> List Elements -> CellState
%%		runOutputs takes the cellState and Elements to be sent
%%		it runs the elements through each output, then sends the results to the sendto's of that output
%%		it then updates the states of all the outputs, and returns a new cellstate
%% 

runOutputs(State, NewElements) ->
	ListOfOutputs = cellState:getOutputs(State),
	AllElements = cellState:getElements(State),
	From = cellState:cellPointer(State),
	Processor = 	fun(Output, ListOfNewStates) ->
						{NewOutputState, ElementsToSend} = outputs:call(Output, AllElements, NewElements),
						ListOfSendTos = outputs:getSendTos(Output),
						sendTo(ListOfSendTos, From, ElementsToSend),
						[NewOutputState] ++ ListOfNewStates
					end,
	%using foldr removes the need to lists:reverse at the end
	ListOfNewStates = lists:foldr(Processor, [], ListOfOutputs),
	%% NOTE: needs to be in the same order as the outputs are in getOutputs above, which means
	%% 		may need to add the name of the output along with the state in the future (if List Output changes)
	cellState:updateOutputStates(ListOfNewStates, State).

sendTo(CellPointers, From, Elements) ->
	Send = 	fun(CellPointer) ->
				cell:sendElements(CellPointer, From, Elements)
			end,
	lists:foreach(Send, CellPointers).

outputAllElements(State, OutputFunction, OutputTo) ->
	AllElements = cellState:getElements(State),
	ElementsList = cellElements:elementsToList(AllElements),
	ThisCell = cellState:getCellPointer(State),
	{NewState, NewElements} = outputs:callOutput(OutputFunction, AllElements, ElementsList),
	cell:sendElements(OutputTo, ThisCell, NewElements),
	NewState.
	
%% ====================================================
%% Utilities
%% ====================================================