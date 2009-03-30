%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : a Controlled Cell is a wrapper to a Cell that 
%%%		prevents adding duplicate copies to sets
%%%		causes add on unit to remove current key
%%%		allows remove on units without a key
%%%		causes add to duplicate key in Map to remove previous value
%%%
%%% -------------------------------------------------------------------
-module(controlledCell).
-compile(export_all).
-behaviour(gen_server).	


-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define(this(Field), State#cellState.Field).

%% Env Exports
-export([start/0, stop/0, makeControlledCell/1, add/2, remove/1, remove/2]).
% %% gen_server callbacks
% -export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3, getPrimitives/0]).

%% Exports
% -export([makeControlledCell/1, addLine/2, removeLine/2, injectDependency/2, inject/3, removeFunc/2, injectIntercept/3, addOnRemove/2]).
% -export([done/1, done/2, addDependency/2, removeDependency/2, leash/1, unleash/1]).
% -export([setKeyRange/3, getStateArray/1, getState/1]).

%% ====================================================================
%% External API
%% ====================================================================

start() ->
	gen_server:start({local, ?MODULE}, ?MODULE, [], []).

stop() ->
	gen_server:call(?MODULE, stop).

makeControlledCell(Type) ->
	Cell = cell:makeCell(),
	OuterType = type:outerType(Type),
	store(Cell#cellPointer.name, OuterType),
	Cell.

add(Cell, Value) ->
	Type = lookup(Cell#cellPointer.name),
	case Type of
		unit ->
			cell:clear(Cell);
		set ->
			cell:removeLine(Cell, Value);
		map ->
			{pair, Key, _} = Value,
			cell:removeLine(Cell, Key)
	end,
	cell:addLine(Cell, Value).

remove(Cell) ->
	cell:clear(Cell).

remove(Cell, Value) ->
	cell:removeLine(Cell, Value).

%% ====================================================================
%% Internal API
%% ====================================================================

store(Name, Obj) ->
	gen_server:cast(?MODULE, {store, Name, Obj}).

lookup(Name) ->
	gen_server:call(?MODULE, {lookup, Name}).

%% ====================================================================
%% Gen Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
    {ok, ets:new(controlledCells, [])}.

handle_call({lookup, Name}, _, State) ->
	Answer = case ets:lookup(State, Name) of
		[{_, Reply}] ->
			Reply;
		[] -> 
			notfound
	end,
    {reply, Answer, State};
handle_call(stop, _, State) ->
	{stop, normal, stopped, State}.

handle_cast({store, Name, Obj}, State) ->
	ets:insert(State, {Name, Obj}),
    {noreply, State}.


handle_info(_, State) -> {noreply, State}.
terminate(_, _) -> ok.
code_change(_, State, _) -> {ok, State}.