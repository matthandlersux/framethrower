%%% -------------------------------------------------------------------
%%% Author  : dailey
%%% Description :
%%%
%%% Created : Sep 23 2009
%%% -------------------------------------------------------------------
-module(action).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
-define (ob(Field), mblib:getVal(Ob, Field)).
% -define (this(Field), State#?MODULE.Field).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
%-define (TABFILE, "data/serialize.ets").

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

-include ("../include/scaffold.hrl").

%% --------------------------------------------------------------------
%% External exports
-export([start/0]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-compile(export_all).



%% ====================================================================
%% External functions
%% ====================================================================

start() -> 
	start_link().
	
start_link() ->
	case gen_server:start({local, ?MODULE}, ?MODULE, [], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.

testJSON() ->
	{ok, JSONBinary} = file:read_file("../lib/bootJSON"),
	Struct = mochijson2:decode( binary_to_list( JSONBinary ) ),
	SharedLetStruct = struct:get_value(<<"sharedLet">>, Struct),
	{struct, Lets} = SharedLetStruct,
	lists:map(fun(Let) ->
		{LetName, LetStruct} = Let,
		LetNameString = binary_to_list(LetName),
		Reply = gen_server:call(?MODULE, {addLet, LetNameString, LetStruct}),
		?trace(Reply)
	end, Lets),
	ok.


addActionsFromJSON(ActionsJSON) ->
	gen_server:cast(?MODULE, {addActionJSON, ActionsJSON}).

performAction(ActionName, Params) ->
	gen_server:call(?MODULE, {performAction, ActionName, Params}).



getState() ->
	gen_server:call(?MODULE, getState).

stop() ->
	gen_server:call(?MODULE, stop).



%% ====================================================================
%% Server functions
%% ====================================================================

%% --------------------------------------------------------------------
%% Function: init/1
%% Description: Initiates the server
%% Returns: {ok, State}          |
%%          {ok, State, Timeout} |
%%          ignore               |
%%          {stop, Reason}
%% --------------------------------------------------------------------
init([]) ->
	process_flag(trap_exit, true),
	State = dict:new(),
    {ok, State}.

%% --------------------------------------------------------------------
%% Function: handle_call/3
%% Description: Handling call messages
%% Returns: {reply, Reply, State}          |
%%          {reply, Reply, State, Timeout} |
%%          {noreply, State}               |
%%          {noreply, State, Timeout}      |
%%          {stop, Reason, Reply, State}   | (terminate/2 is called)
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_call({addLet, LetName, LetStruct}, _, State) ->
	NewState = dict:store(LetName, LetStruct, State),
    {reply, ok, NewState};
handle_call({performAction, ActionName, Params}, _, State) ->
	ActionJSON = dict:find(ActionName, State),
	?trace("Performing Action"),
	?trace(ActionJSON),
	
	
	
    {reply, ok, State};
handle_call(getState, _, State) ->
	{reply, State, State};
handle_call(stop, _, State) ->
	{stop, normal, stopped, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({serializeEnv, _}, State) ->
    {noreply, State};
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.


%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info(Info, State) ->
    {noreply, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(Reason, State) ->
    ok.

%% --------------------------------------------------------------------
%% Func: code_change/3
%% Purpose: Convert process state when code is changed
%% Returns: {ok, NewState}
%% --------------------------------------------------------------------
code_change(OldVsn, State, Extra) ->
    {ok, State}.

%% --------------------------------------------------------------------
%%% Internal functions
%% --------------------------------------------------------------------

%%For Now we'll have all the functions for processing template JSON here. Will want to reorganize this into another file probably

% returns {Result, NewEnv}, Env may change because it is lazy
evaluateLine(Line, Env) -> ok.
	% Kind = 	binary_to_list(struct:get_value(<<"kind">>, Line)),
	% case Kind of
	% 	"lineExpr" ->
	% 		Expr = binary_to_list(struct:get_value(<<"expr">>, Line)),
	% 		expr:exprParse(Expr, Env);
	% 	"lineTemplate" ->
	% 		
	% 	"lineJavascript" ->
	% 	"lineXML" ->
	% 	"lineState" ->
	% 	"lineAction" ->
	% 	"actionCreate" ->
	% end.
% 
% function evaluateLine(line, env) {
% 	
% 	if (line.kind === "lineExpr") {
% 		var expr = parseExpression(line.expr, env);
% 		return expr;
% 	} else if (line.kind === "lineTemplate") {
% 		return makeClosure(line, env);
% 	} else if (line.kind === "lineJavascript") {
% 		if (line.f.length === 0) return line.f();
% 		else return makeFun(line.type, curry(line.f));
% 		//return makeFun(parseType(line.type), line.f);
% 	} else if (line.kind === "lineXML") {
% 		return makeXMLP(line.xml, env);
% 	} else if (line.kind === "lineState") {
% 		var ac = evaluateLine(line.action, env);
% 		return executeAction(ac);		
% 		//return makeCC(line.type);
% 		//return makeCC(parseType(line.type));
% 	} else if (line.kind === "lineAction") {
% 		return makeActionClosure(line, env);
% 	} else if(line.kind === "actionCreate") {
% 		// TODO actions in a let are possible in actions, but not in templates? may as well be in both.
% 		// desugar as a one-action lineAction:
% 		var lineAction = {actions: [{action: line}]};
% 		return makeActionClosure(lineAction, env);
% 	}
% }
% 



executeAction() -> ok.

makeActionClosure() -> ok.

accumulate(SavedArgs, Fun, Expects) ->
	case lists:length(SavedArgs) of
		Expects -> Fun(SavedArgs);
		_ -> fun (Arg) -> accumulate([Arg | SavedArgs], Fun, Expects) end
	end.

curry(Fun, Expects) ->
	accumulate([], Fun, Expects).

extendEnv(Env, Scope) -> 
	dict:merge(fun(A, B) -> A end, Env, Scope).

makeClosure(LineTemplate, Env) ->
	Params = struct:get_value(<<"params">>, LineTemplate),
	Type = struct:get_value(<<"type">>, LineTemplate),
	ParamLength = lists:length(Params),
	F = curry(fun(Args) -> 
		Scope = dict:new(),
		ArgsAndParams = lists:zip(Args, Params),
		NewScope = lists:foldl(fun({Arg, Param}, InnerScope) -> 
			dict:store(binary_to_list(Param), Arg, InnerScope)
		end, Scope, ArgsAndParams),
		EnvWithParams = extendEnv(Env, NewScope),
		Lets = struct:get_value(<<"let">>, LineTemplate),
		EnvWithLets = addLets(Lets, EnvWithParams),
		Output = struct:get_value(<<"output">>, LineTemplate),
		evaluateLine(Output, EnvWithLets)
	end, ParamLength),
	case ParamLength of
		0 -> F;
		_ -> #exprFun{function=F}
	end.

% Should have this somewhere
% parseExpression() -> ok.

addLets(Lets, Env) -> ok.


% function addLets(lets, env) {
% 	var memo = {};
% 	function newEnv(s) {
% 		if (memo[s] !== undefined) {
% 			return memo[s];
% 		} else if (lets[s] !== undefined) {
% 			memo[s] = evaluateLine(lets[s], newEnv);
% 			return memo[s];
% 		} else {
% 			return env(s);
% 		}
% 	}
% 	return newEnv;
% }


addFun() -> ok.

makeActionErlang() -> ok.