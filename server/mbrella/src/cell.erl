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
%% primfunc api
%% 

%create cell is defined above

leash(CellPointer) ->
	gen_server:cast(cellPid(CellPointer), leash).
	
unleash(CellPointer) ->
	gen_server:cast(cellPid(CellPointer), unleash).

%% 
%% inject output function, function color -> {mod, function, args} = outputfunction
%% 

injectOutput(CellPointer, OutputFunction, OutputTo) ->
	gen_server:cast(cellPid(CellPointer), {injectOutput, OutputFunction, OutputTo}).

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

handle_cast({injectOutput, OutputFunction, OutputTo}, State) ->
	link(cellPid(OutputTo)),
	{noreply, cellState:injectOutput(State, OutputFunction, OutputTo)};
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
