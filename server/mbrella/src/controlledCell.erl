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

-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define(this(Field), State#cellState.Field).

%% Env Exports
% -export([add/2, remove/1, remove/2]).
% %% gen_server callbacks
% -export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3, getPrimitives/0]).

%% Exports
% -export([makeControlledCell/1, addLine/2, removeLine/2, injectDependency/2, inject/3, removeFunc/2, injectIntercept/3, addOnRemove/2]).
% -export([done/1, done/2, addDependency/2, removeDependency/2, leash/1, unleash/1]).
% -export([setKeyRange/3, getStateArray/1, getState/1]).

%% ====================================================================
%% External API
%% ====================================================================

add(Type, Cell, Value) ->
	case type:outerType(Type) of
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
