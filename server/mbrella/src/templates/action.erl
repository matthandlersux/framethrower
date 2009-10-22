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

-include ("../../include/scaffold.hrl").

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
	JSONBinary = case file:read_file("priv/bootJSON") of
		{ok, JSON} -> JSON;
		{error, Error} -> ?trace("Error"), throw(Error)
	end,
	Struct = mochijson2:decode( binary_to_list( JSONBinary ) ),
	
	SharedLetStruct = struct:get_value(<<"sharedLet">>, Struct),
	%convert exprs within sharedLetStruct to use erlang records instead of JSON
	SharedLetConverted = mapFields(SharedLetStruct, <<"expr">>, fun(Expr) -> convertJSONExpression(Expr, dict:new()) end),
	%convert types within sharedLetStruct to use erlang records instead of JSON
	SharedLetConverted2 = mapFields(SharedLetConverted, <<"type">>, fun(Type) -> convertJSONType(Type) end),
	
	{struct, Lets} = SharedLetConverted2,
	lists:map(fun(Let) ->
		{LetName, LetStruct} = Let,
		LetNameString = binary_to_list(LetName),
		gen_server:call(?MODULE, {addLet, LetNameString, LetStruct})
	end, Lets),
	ok.


addActionsFromJSON(ActionsJSON) ->
	gen_server:cast(?MODULE, {addActionJSON, ActionsJSON}).

evaluateTemplate(Name, Params) ->
	gen_server:call(?MODULE, {evaluateTemplate, Name, Params}).



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
	Closure = makeClosure(LetStruct, scope:makeScope()),
	NewState = dict:store(LetName, Closure, State),
    {reply, ok, NewState};
handle_call({evaluateTemplate, Name, Params}, _, State) ->
	Closure = case dict:find(Name, State) of
		{ok, Found} -> Found;
		error -> throw("Error finding template: " ++ Name)
	end,
	AppliedClosure = ast:makeApply(Closure, Params),
	Result = eval:evaluate(AppliedClosure),
    {reply, Result, State};
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
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.


%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info(_Info, State) ->
    {noreply, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(_Reason, _State) ->
    ok.

%% --------------------------------------------------------------------
%% Func: code_change/3
%% Purpose: Convert process state when code is changed
%% Returns: {ok, NewState}
%% --------------------------------------------------------------------
code_change(_OldVsn, State, _Extra) ->
    {ok, State}.

%% --------------------------------------------------------------------
%%% Internal functions
%% --------------------------------------------------------------------

%%For Now we'll have all the functions for processing template JSON here. Will want to reorganize this into another file probably


evaluateLine(Line, Scope) ->
	Kind = binary_to_list(struct:get_value(<<"kind">>, Line)),
	case Kind of
		"lineExpr" ->
			Expr = (struct:get_value(<<"expr">>, Line)),
			parse:bind(Expr, Scope);
		"lineTemplate" ->
			makeClosure(Line, Scope);
		"lineState" ->
			Action = (struct:get_value(<<"action">>, Line)),
			executeAction(evaluateLine(Action, Scope));
		"lineAction" ->
			makeActionClosure(Line, Scope);
		"actionCreate" ->
			% TODO actions in a let are possible in actions, but not in templates? may as well be in both.
			% desugar as a one-action lineAction:			
			EmptyStruct = {struct, []},
			ActionStruct = struct:set_value(<<"action">>, Line, EmptyStruct),
			LineAction = struct:set_value(<<"actions">>, ActionStruct, EmptyStruct),
			makeActionClosure(LineAction, Scope);
		"lineJavascript" ->
			ignore;
		"lineXML" ->
			ignore
	end.



executeAction(ActionClosure) ->
	{instruction, Instructions, Scope} = ActionClosure,
	lists:foldr(fun(ActionLet, _) ->
		Action = struct:get_value(<<"action">>, ActionLet),
		ActionKind = struct:get_value(<<"kind">>, Action),
		Output = case ActionKind of
			<<"actionCreate">> ->
				Type = struct:get_value(<<"type">>, Action),
				case type:isReactive(Type) of
					true -> cell:makeCell(type:outerType(Type));
					false -> 
						Prop = struct:get_value(<<"prop">>, Action),	
						objects:create(Type, Prop)
				end;
			<<"extract">> ->
				ok;
			<<"actionJavascript">> ->
				ok;
			Other ->
				ok
		end,
		ActionName = struct:get_value(<<"name">>, Action),
		case {ActionName, Output} of
			{undefined, _} ->
				nosideeffect;
			{_, undefined} ->
				throw(["Trying to assign a let action, but the action has no return value", ActionLet]);
			{_, _} ->
				scope:addLet(ActionName, Output, Scope)
		end,
		Output
	end, noOutput, Instructions).
	


% function executeAction(instruction) {
% 	var scope = {};
% 	var env = extendEnv(instruction.env, scope);
% 	
% 	var output;
% 	
% 	function evalExpr(expr) {
% 		return evaluate2(convertJSONExpression(expr, env));
% 	}
% 	
% 	forEach(instruction.instructions, function (actionLet) {
% 		output = undefined;
% 		var action = actionLet.action;
% 		if (action.kind === "actionCreate") {
% 			// we're dealing with: {kind: "actionCreate", type: TYPE, prop: {PROPERTYNAME: AST}}
% 			
% 			if (isReactive(action.type)) {
% 				output = makeCC(action.type);
% 			} else {
% 				output = objects.make(action.type.value, map(action.prop, evalExpr));
% 			}
% 		} else if (action.kind === "extract") {
% 			// we're dealing with: {kind: "extract", select: AST, action: LINETEMPLATE} // this lineTemplate should take one (or two) parameters.
% 			
% 			var closure = makeClosure(action.action, env);
% 			var inner;
% 			var isMap = !!closure.type.left.left;
% 			if (isMap) {
% 				inner = function (o) {
% 					return evaluate(makeApply(makeApply(closure, o.key), o.val));
% 				};
% 			} else {
% 				inner = function (key) {
% 					return evaluate(makeApply(closure, key));
% 				};
% 			}
% 			
% 			var select = evalExpr(action.select);
% 			
% 			// note that output will be the result of the last action:
% 			if (select.kind === "list") {
% 				forEach(select.asArray, function (element) {
% 					output = executeAction(inner(element));
% 				});
% 			} else {
% 				var done = false;
% 				var cell = select;
% 				var injectedFunc = cell.injectDependency(function () {
% 					if (!done) {
% 						done = true;
% 						forEach(cell.getState(), function (element) {
% 							output = executeAction(inner(element));
% 						});
% 					}
% 				});
% 				injectedFunc.unInject();
% 			}
% 		} else if(action.kind==="actionJavascript") {
% 			// we're dealing with: {kind: "actionJavascript", f: function}
% 			output = action.f();
% 		} else {
% 			// we're dealing with a LINE
% 			
% 			//var evaled = evaluateLine(action, env);
% 			var evaled = evaluate(evaluateLine(action, env));
% 			if (evaled.kind === "instruction") {
% 				// the LINE evaluated to an Action
% 				output = executeAction(evaled);
% 			} else
% 				debug.error("non-action expression in an action", action);
% 		}
% 		
% 		if (actionLet.name) {
% 			if (output === undefined) {
% 				debug.error("Trying to assign a let action, but the action has no return value", actionLet);
% 			}
% 			scope[actionLet.name] = output;
% 		}
% 	});
% 	
% 	return output;
% }


makeActionClosure(LineAction, Scope) ->
	{instruction, struct:get_value(<<"actions">>, LineAction), Scope}.


makeClosure(LineTemplate, ParentScope) ->
	Params = struct:get_value(<<"params">>, LineTemplate),
	ParamLength = length(Params),

	%make a new scope for this closure
	Scope = scope:makeScope(ParentScope),

	% add the lets in the closure to the scope lazily
	Lets = struct:get_value(<<"let">>, LineTemplate),
	LetsList = struct:to_list(Lets),
	
	lists:map(fun({LetName, LetValue}) -> 
		GetValue = fun() -> 
			evaluateLine(LetValue, Scope)
		end,
		scope:addLazyLet(Scope, binary_to_list(LetName), GetValue)
	end, LetsList),	
	
	% the output of the closure
	Output = struct:get_value(<<"output">>, LineTemplate),
	ast:makeClosure(Params, Output, Scope, ParamLength).


% closureFunction is called by ast:apply
closureFunction(Params, Output, Scope, Args) -> 
	% add the arguments to the closure to the scope
	ParamsAndArgs = lists:zip(Params, Args),
	lists:map(fun({Param, Arg}) -> 
		scope:addLet(Scope, binary_to_list(Param), Arg)
	end, ParamsAndArgs),
	% evaluate the output of the closure
	evaluateLine(Output, Scope).




addFun() -> ok.

makeActionErlang() -> ok.







%copied from parse.erl. TODO: put in utility file
extractPrim(VarOrPrim) ->
	case VarOrPrim of
		"null" -> null;
		"true" -> true;
		"false" -> false;
		_ ->
			try list_to_integer(VarOrPrim)
			catch _:_ ->
				try list_to_float(VarOrPrim)
				catch _:_ ->
					error
				end
			end
	end.
	

%%	===========================
%%	JSON to AST/TYPE conversion
%%
%%  ===========================

%% Convert a JSON expression to an expression using erlang records in deBruijn format
convertJSONExpression({struct, [{<<"cons">>, <<"apply">>}, {<<"left">>, Left}, {<<"right">>, Right}]}, DeBruijnHash) ->
	ast:makeApply(convertJSONExpression(Left, DeBruijnHash), convertJSONExpression(Right, DeBruijnHash));
convertJSONExpression({struct, [{<<"cons">>, <<"lambda">>}, {<<"left">>, Left}, {<<"right">>, Right}]}, DeBruijnHash) ->
	NewDeBruijnHash = dict:map(fun(_Key, Value) -> Value + 1 end, DeBruijnHash),
	VarName = Left,
	NewerDeBruijnHash = dict:store(VarName, 1, NewDeBruijnHash),
	ast:makeLambda(convertJSONExpression(Right, NewerDeBruijnHash));
convertJSONExpression(Binary, DeBruijnHash) when is_binary(Binary) ->
	case dict:find(Binary, DeBruijnHash) of
		{ok, Index} ->
			ast:makeVariable(Index);
		error ->
			String = binary_to_list(Binary),
			case extractPrim(String) of
				error ->
					ast:makeUnboundVariable(String);
				Prim ->
					ast:makeLiteral(Prim)
			end
	end.


%% Convert a JSON type to a type using erlang records
convertJSONType({struct, [{<<"kind">>, <<"typeApply">>}, {<<"left">>, Left}, {<<"right">>, Right}]}) ->
	type:makeApply(convertJSONType(Left), convertJSONType(Right));
convertJSONType({struct, [{<<"kind">>, <<"typeLambda">>}, {<<"left">>, Left}, {<<"right">>, Right}]}) ->
	type:makeLambda(convertJSONType(Left), convertJSONType(Right));
convertJSONType({struct, [{<<"kind">>, <<"typeVar">>}, {<<"value">>, Value}]}) ->
	String = binary_to_list(Value),
	type:makeTypeVar(String);
convertJSONType({struct, [{<<"kind">>, <<"typeName">>}, {<<"value">>, Value}]}) ->
	String = binary_to_list(Value),
	type:makeTypeName(list_to_atom(string:to_lower(String))).


%% run MapFunction on anything with name FieldName in JSON
mapFields({struct, List}, FieldName, MapFunction) -> 
	ConvertedList = lists:map(fun({Name, Value}) ->
		case Name of
			FieldName -> {Name, MapFunction(Value)};
			_ -> {Name, mapFields(Value, FieldName, MapFunction)}
		end
	end, List),
	{struct, ConvertedList};
mapFields(List, FieldName, MapFunction) when is_list(List) ->
	lists:map(fun(Element) ->
		mapFields(Element, FieldName, MapFunction)
	end, List);
mapFields(NonJSON, _, _) ->
	NonJSON.