-module (env).

-behaviour(gen_server).
-import(mblib, [curry/1]).
-include ("../include/scaffold.hrl").
-export([start/0, stop/0, getDefaultEnv/0]).
%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

start() ->
	gen_server:start({local, ?MODULE}, ?MODULE, [], []).

stop() ->
	gen_server:call(?MODULE, stop).

getDefaultEnv() ->
	gen_server:call(?MODULE, getDefaultEnv).
	
getPrimitives() ->
	BuildEnv = fun(#exprFun{function = Func, type = TypeString, name = Name} = Expr, {Suffix, Dict}) ->
			{Suffix + 1, dict:store(Name, Expr#exprFun{function=curry(Func),type = type:shiftVars( type:parse(TypeString), integer_to_list(Suffix) ++ "v")}, Dict)}
		end,
	% BuildEnv = fun({Name, TypeString, Fun}, {Suffix, Dict}) ->
	% 				{Suffix + 1, dict:store(Name, {type:shiftVars( type:parse(TypeString), integer_to_list(Suffix) ++ "v"), Fun}, Dict)}
	% 			end,
	FunList = primFuncs:primitives(),
	{_, FinalDict} = lists:foldl( BuildEnv, {1, dict:new()}, FunList),
	FinalDict.

addExpr({Name, ExprString}, Env) ->
	dict:store(Name, expr:expr(expr:parse(ExprString), Env), Env).	
	
%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
	PrimEnv = getPrimitives(),
	FuncExprs = [
		{"plus1", "x -> add x 1"},
		{"compose", "f -> g -> x -> f (g x)"},
		{"const", "x -> y -> x"},
		{"swap", "f -> x -> y -> f y x"}
	],
	DefaultEnv = lists:foldl(fun addExpr/2, PrimEnv, FuncExprs),
    {ok, DefaultEnv}.

handle_call(getDefaultEnv, From, State) ->
    {reply, State, State};
handle_call(stop, From, State) ->
	{stop, normal, stopped, State}.


handle_cast(_, State) -> {noreply, State}.
handle_info(_, State) -> {noreply, State}.
terminate(Reason, State) -> ok.
code_change(OldVsn, State, Extra) -> {ok, State}.