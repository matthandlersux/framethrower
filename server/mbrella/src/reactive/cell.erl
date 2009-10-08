-module (cell).

-behaviour(gen_server).

-compile(export_all).

-include("../../include/scaffold.hrl").


% -ifdef( debug ).
% -define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
% -else.
% -define( trace(X), void ).
% -endif.
% -define(this(Field), State#cellState.Field).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).


-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).
-export ([
	makeCell/0, makeCell/1, makeLinkedCell/0, makeCellLeashed/0, makeLinkedCellLeashed/0,
	sendElements/3,
	leash/1, unleash/1,
	injectOutput/2, injectOutput/3,
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
	{ok, Pid} = gen_server:start(?MODULE, [CellType, {leashed, true}], []),
	%Name = env:nameAndStoreCell(Pid),
	Name = "server" ++ integer_to_list(random:uniform(1000)),
	cellPointer:new(Name, Pid).

makeLinkedCellLeashed() -> makeLinkedCellLeashed(unit).

makeLinkedCellLeashed(CellType) ->
	{ok, Pid} = gen_server:start(?MODULE, [CellType, {leashed, true}], []),
	%Name = env:nameAndStoreCell(Pid),
	Name = "server" ++ integer_to_list(random:uniform(1000)),
	cellPointer:new(Name, Pid).

%% 
%% add/remove Elements
%% 

%% 
%% sendElements :: CellPointer -> CellPointer -> Elements -> ok
%% Elements :: List Tuple ("add" | "remove") Value
%%

sendElements(CellPointer, Elements) ->
	sendElements(CellPointer, cellPointer:dummy(), Elements).
	
sendElements(CellPointer, From, Elements) ->
	gen_server:cast(cellPointer:pid(CellPointer), {sendElements, From, Elements}).
	
%% 
%% addValue :: CellPointer -> Value -> ok
%% 

addValue(CellPointer, Value) ->
	addValues(CellPointer, [Value]).

%% 
%% addValues :: CellPointer -> List Value -> ok
%% 

addValues(CellPointer, Values) ->
	Elements = lists:map(fun(V) -> {add, V} end, Values),
	gen_server:cast(cellPointer:pid(CellPointer), {injectElements, Elements}).
	
%% 
%% removeValue :: CellPointer -> Value -> ok
%% 

removeValue(CellPointer, Value) ->
	removeValues(CellPointer, [Value]).

%% 
%% addValues :: CellPointer -> List Value -> ok
%% 

removeValues(CellPointer, Values) ->
	Elements = lists:map(fun(V) -> {remove, V} end, Values),
	gen_server:cast(cellPointer:pid(CellPointer), {injectElements, Elements}).
	
%% 
%% setFlag :: CellPointer -> Atom -> Bool -> ok
%% 

setFlag(CellPointer, Flag, Setting) ->
	gen_server:cast(cellPointer:pid(CellPointer), {setFlag, Flag, Setting}).

%% ====================================================
%% PrimFun API
%% ====================================================

%create cell is defined above

leash(CellPointer) ->
	gen_server:cast(cellPointer:cellPid(CellPointer), {setFlag, leashed, true}).
	
unleash(CellPointer) ->
	gen_server:cast(cellPointer:cellPid(CellPointer), {setFlag, leashed, false}).

%% 
%% injectOutput :: CellPointer -> CellPointer -> ok
%% 

injectOutput(CellPointer, OutputToCellPointer) ->
	injectOutput(CellPointer, OutputToCellPointer, send).

%% 
%% injectOutput :: CellPointer -> CellPointer -> Atom -> ok
%% 

injectOutput(CellPointer, OutputToCellPointer, OutputName) ->
	injectOutput(CellPointer, OutputToCellPointer, OutputName, []).

%% 
%% injectOutput :: CellPointer -> CellPointer -> Atom -> List a -> ok
%% 
	
injectOutput(CellPointer, OutputToCellPointer, OutputName, Arguments) ->
	OutputFunction = {OutputName, Arguments},
	gen_server:cast(
		cellPointer:pid(CellPointer),
		{injectOutput, OutputToCellPointer, OutputFunction}
	).
	
%% 
%% uninjectOutput :: CellPointer -> CellPointer -> ok
%% 		
%%		 

uninjectOutput(CellPointer, OutputToCellPointer) ->
	uninjectOutput(CellPointer, OutputToCellPointer, send).

%% 
%% uninjectOutput :: CellPointer -> CellPointer -> Atom -> ok
%% 		
%%		

uninjectOutput(CellPointer, OutputToCellPointer, OutputName) ->
	uninjectOutput(CellPointer, OutputToCellPointer, OutputName, []).
	
%% 
%% uninjectOutput :: CellPointer -> CellPointer -> Atom -> List a -> ok
%% 		
%%		

uninjectOutput(CellPointer, OutputToCellPointer, OutputName, Arguments) ->
	OutputFunction = {OutputName, Arguments},
	gen_server:cast(
		cellPointer:pid(CellPointer),
		{uninjectOutput, OutputToCellPointer, OutputFunction}
	).

%% 
%% injectIntercept :: CellPointer -> InterceptName -> ok
%% 

injectIntercept(CellPointer, InterceptName) ->
	injectIntercept(CellPointer, InterceptName, []).

%% 
%% injectIntercept :: CellPointer -> InterceptName -> List a -> ok
%% 

injectIntercept(CellPointer, InterceptName, Args) ->
	Intercept = intercepts:construct(InterceptName, Args),
	gen_server:cast(
		cellPointer:pid(CellPointer),
		{injectIntercept, Intercept}
	).
	
%% 
%% addInformant :: CellPointer -> CellPointer -> ok
%% 

addInformant(CellPointer, Informant) ->
	gen_server:cast(cellPointer:pid(CellPointer), {addInformant, Informant}).
	
%% 
%% removeInformant :: CellPointer -> CellPointer -> ok
%% 

removeInformant(CellPointer, Informant) ->
	gen_server:cast(cellPointer:pid(CellPointer), {removeInformant, Informant}).
	
%% 
%% kill :: CellPointer -> ok
%% 		
%%		

kill(CellPointer) ->
	gen_server:cast(cellPointer:pid(CellPointer), kill).



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


handle_cast({addInformant, InformantCellPointer}, State) ->
	{noreply, cellState:addInformant(State, InformantCellPointer)};

handle_cast({removeInformant, InformantCellPointer}, State) ->
	{noreply, cellState:removeInformant(State, InformantCellPointer)};

handle_cast({injectIntercept, InterceptPointer}, State) ->
	Informants = intercepts:getArguments(InterceptPointer),
	Informants1 = cellPointer:filterList(Informants),
	Informants2 = Informants1 -- [cellState:cellPointer(State)],
	State1 = cellState:updateInformants(State, Informants2),
	{noreply, cellState:injectIntercept(State1, InterceptPointer)};

handle_cast({injectElements, Elements}, CellState) ->
	CellState1 = injectElements(CellState, Elements),
	{noreply, CellState1};
	
handle_cast({sendElements, From, Elements}, State) ->
	if
		Elements =:= [] ->
			{noreply, cellState:setDone(State, From)};
		true -> 
			State2 = 
				case cellState:getIntercept(State) of
					undefined ->
						NewElements = Elements,
						cellState:setDone(State, From);
					Intercept ->
						{InterceptState, NewElements} = intercepts:call(Intercept, From, Elements),
						State1 = cellState:updateInterceptState(State, InterceptState),
						cellState:setDone(State1, From)
				end,
	
			CellState = injectElements(State2, NewElements),
			
			% TODO!! IF FLAG IS SET, CHECK IF EMPTY, KILL CELL IF NECESSARY
			{noreply, CellState}
	end;

handle_cast({injectOutput, OutputTo, OutputFunction}, State) ->
	link(cellPointer:pid(OutputTo)),
	NewState1 = cellState:injectOutput(State, OutputFunction, OutputTo),
	Outputs = cellState:getOutputs(NewState1),
	Output = outputs:getOutput(OutputFunction, Outputs),
	NewState2 = outputAllElements(NewState1, Output, OutputTo),
	{noreply, NewState2};

handle_cast({uninjectOutput, OutputTo, OutputFunction}, State) ->
	unlink(cellPointer:pid(OutputTo)),
	Outputs = cellState:getOutputs(State),
	Output = outputs:getOutput(OutputFunction, Outputs),
	NewState = unoutputAllElements(State, Output, OutputTo),
	NewState1 = cellState:uninjectOutput(NewState, OutputFunction, OutputTo),
	{noreply, NewState1};

handle_cast({setFlag, Flag, Setting}, State) ->
	{noreply, cellState:setFlag(State, Flag, Setting)};
	
handle_cast(kill, State) ->
	{stop, normal, cellState:setFlag(State, leashed, true)}.

terminate(normal, State) ->
	?trace(killed),
    Outputs = cellState:getOutputs(State),
	UnOutputAll = 	fun(Output) ->
						Connections = outputs:getConnections(Output),
						SendUnOutput = 	fun(Connection) ->
											unoutputAllElements(State, Output, Connection)
										end,
						lists:foreach(SendUnOutput, Connections)
					end,
	lists:foreach(UnOutputAll, Outputs);
	% tell all informants to remove you maybe?
terminate(Reason, State) ->
	Reason.

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
						ListOfConnections = outputs:getConnections(Output),
						sendTo(ListOfConnections, From, ElementsToSend),
						[NewOutputState] ++ ListOfNewStates
					end,
	ListOfNewStates = lists:foldr(Processor, [], ListOfOutputs),
	%% NOTE: needs to be in the same order as the outputs are in getOutputs above, which means
	%% 		may need to add the name of the output along with the state in the future (if List Output changes)
	cellState:updateOutputStates(ListOfNewStates, State).

%% 
%% sendTo :: List CellPointer -> CellPointer -> List Element -> void
%% 

sendTo(CellPointers, From, Elements) ->
	Send = 	fun(CellPointer) ->
				cell:sendElements(CellPointer, From, Elements)
			end,
	lists:foreach(Send, CellPointers).

%% 
%% outputAllElements :: CellState -> Output -> CellPointer -> CellState
%% 

outputAllElements(CellState, Output, OutputTo) ->
	AllElements = cellState:getElements(CellState),
	ElementsList = cellElements:toList(AllElements),
	ThisCell = cellState:cellPointer(CellState),
	{OutputState, NewElements} = outputs:call(Output, AllElements, ElementsList),
	NewCellState = cellState:updateOutputState(CellState, Output, OutputState),
	cell:sendElements(OutputTo, ThisCell, NewElements),
	NewCellState.

%% 
%% unoutputAllElements :: CellState -> Output -> CellPointer -> CellState
%% 		
%%		

unoutputAllElements(CellState, Output, OutputTo) ->
	AllElements = cellState:getElements(CellState),
	ElementsList = cellElements:toListOfRemoves(AllElements),
	ThisCell = cellState:cellPointer(CellState),
	{OutputState, NewElements} = outputs:call(Output, AllElements, ElementsList),
	NewCellState = cellState:updateOutputState(CellState, Output, OutputState),
	cell:sendElements(OutputTo, ThisCell, NewElements),
	NewCellState.


%% 
%% injectElements :: CellState -> List Element -> CellState
%% 

injectElements(CellState, Elements) ->
	IsDone = cellState:isDone(CellState),
	WaitForDone = cellState:getFlag(CellState, waitForDone),
	IsLeashed = cellState:getFlag(CellState, leashed),
	
	if
		IsLeashed orelse (WaitForDone andalso (not IsDone)) ->
			cellState:updateStash(CellState, Elements);
		true ->
			Elements1 = cellState:getStash(CellState),
			CellState1 = cellState:emptyStash(CellState),
			{CellState2, Elements2} = cellState:injectElements(CellState1, Elements ++ Elements1),
			runOutputs(CellState2, Elements2)
	end.
		
%% ====================================================
%% Utilities
%% ====================================================