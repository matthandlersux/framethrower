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
%% sendElements :: CellPointer -> CellName -> Elements -> ok
%% Elements :: List Tuple ("add" | "remove") Elements

sendElements(CellPointer, From, Elements) ->
	gen_server:cast(cellPid(CellPointer), {sendElements, From, self(), Elements}).

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
	injectOutput(CellPointer, OutputToCellPointer, send).
	
injectOutput(CellPointer, OutputToCellPointer, OutputFunction) ->
	gen_server:cast(
		cellPointer:pid(CellPointer), 
		{injectOutput, OutputToCellPointer, OutputFunction }
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


%% ====================================================
%% gen_server callbacks
%% ====================================================

init() ->
	process_flag(trap_exit, true),
    {ok, #cellState{
		
	}}.
	
init([leashed]) ->
	process_flag(trap_exit, true),
    {ok, #cellState{
		leashed = true
	}}.

handle_call(Msg, From, State) ->
    Reply = ok,
    {reply, Reply, State}.

handle_cast({injectIntercept, InterceptPointer}, State) ->
	{noreply, cellState:injectIntercept(State, InterceptPointer)};
handle_cast({sendElements, From, Pid, Elements}, State) ->
	% newElements should only be ones that actually get added, not ones that add weight
	% if intercept is undefined, just strip the name from the messages
	{NewState, NewElements} = cellState:interceptElements(State, From, Elements),
	%incase running outputs changes the output's state
	
	%%%%% need to chunk the elements if we have a huge list
	
	NewState1 = runOutputs(State, NewElements),
	{noreply, NewState};
handle_cast({injectOutput, OutputFunction, OutputTo}, State) ->
	link(cellPid(OutputTo)),
	NewState = cellState:injectOutput(State, OutputFunction, OutputTo),
	outputAllElements(State, OutputFunction, OutputTo),
	{noreply, NewState};
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
