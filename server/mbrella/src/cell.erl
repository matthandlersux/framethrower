-module (cell.erl).

-behaviour(gen_server).

-compile(export_all).

-include("../include/scaffold.hrl").

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.
-define(this(Field), State#cellState.Field).

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


makeCell() ->
	{ok, Pid} = gen_server:start(?MODULE, [], []),
	Name = env:nameAndStoreCell(Pid),
	#cellPointer{name = Name, pid = Pid}.
	
makeLinkedCell() ->
	{ok, Pid} = gen_server:start_link(?MODULE, [], []),
	Name = env:nameAndStoreCell(Pid),
	#cellPointer{name = Name, pid = Pid}.
	
makeCellLeashed() ->
	{ok, Pid} = gen_server:start(?MODULE, [leashed], []),
	Name = env:nameAndStoreCell(Pid),
	#cellPointer{name = Name, pid = Pid}.
	
makeLinkedCellLeashed() ->
	{ok, Pid} = gen_server:start(?MODULE, [leashed], []),
	Name = env:nameAndStoreCell(Pid),
	#cellPointer{name = Name, pid = Pid}.

%% 
%% add/remove Elements
%% 

%% 
%% sendElements :: CellPointer -> CellPointer -> Elements -> ok
%% Elements :: List Tuple ("add" | "remove") Elements

sendElements(CellPointer, From, Elements) ->
	gen_server:cast(cellPointer:pid(CellPointer), {sendElements, From, Elements});
% sendElements(CellPointer, From, Elements) ->
% 	gen_server:cast(cellPid(CellPointer), {sendElements, From, self(), Elements}).
	
sendMessages(CellPointer, Messages) ->
	gen_server:cast(cellPointer:pid(CellPointer), {sendMessages, Messages}).

%% 
%% primfunc api
%% 

%create cell is defined above

leash(CellPointer) ->
	gen_server:cast(cellPid(CellPointer), leash).
	
unleash(CellPointer) ->
	gen_server:cast(cellPid(CellPointer), unleash).

%% 
%% inject output function 
%% 

injectOutput(CellPointer, OutputToCellPointer) ->
	injectOutput(CellPointer, OutputToCellPointer, {send, undefined, []}).
	
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
	From = cellState:cellPointer(State),
	Processor = 	fun(Output, ListOfNewStates) ->
						{NewOutputState, ElementsToSend} = outputs:callOutput(Output, NewElements),
						outputs:sendTo(Output, From, ElementsToSend),
						[NewOutputState] ++ ListOfNewStates
					end,
	%using foldr removes the need to lists:reverse at the end
	ListOfNewStates = lists:foldr(Processor, [], ListOfOutputs),
	cellState:updateOutputStates(ListOfNewStates, State).
	
outputAllElements(State, OutputFunction, OutputTo) ->
	Elements = cellState:getElements(State),
	ThisCell = cellState:getCellPointer(State),
	{NewState, NewElements} = outputs:callOutput(OutputFunction, Elements),
	cell:sendElements(OutputTo, ThisCell, NewElements),
	NewState.

%% ====================================================
%% gen_server callbacks
%% ====================================================

init() ->
	process_flag(trap_exit, true),
    {ok, cellState:new()}.

%% 
%% 
%% Flags :: List a, a :: leashed | 
%% 

init(Flags) ->
	process_flag(trap_exit, true),
    {ok, cellState:new(Flags)}.



handle_call(Msg, From, State) ->
    Reply = ok,
    {reply, Reply, State}.



handle_cast({injectIntercept, InterceptPointer}, State) ->
	{noreply, cellState:injectIntercept(State, InterceptPointer)};
	
handle_cast({sendElements, From, Elements}, State) ->
	Intercept = cellState:getIntercept(State),
	{NewState, NewElements} = intercepts:call(Intercept, From, Elements),
	State1 = cellState:updateIntercept(NewState),
	
	FinalElements = cellState:updateElements(NewElements),
	
	NewState1 = runOutputs(State, FinalElements),
	{noreply, NewState};
	
handle_cast({injectOutput, OutputFunction, OutputTo}, State) ->
	link(cellPid(OutputTo)),
	NewState1 = cellState:injectOutput(State, OutputFunction, OutputTo),
	NewState2 = outputAllElements(NewState1, OutputFunction, OutputTo),
	{noreply, NewState2};
	
handle_cast(leash, State) ->
    {noreply, State#cellState{leash = true}};

handle_cast(unleash, State) ->
	{noreply, State#cellState{leash = false}}.

terminate(Reason, State) ->
    ok.

handle_info(Info, State) ->
    {noreply, State}.

code_change(OldVsn, State, Extra) ->
    {ok, State}.

%% ====================================================
%% Utilities
%% ====================================================

cellPid(CellPointer) ->
	CellPointer#cellPointer.pid.
	
cellName(CellPointer) ->
	CellPointer#cellPointer.name.
