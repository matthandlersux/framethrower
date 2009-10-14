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
	SharedLetConverted = mapFields(SharedLetStruct, <<"expr">>, fun(Expr) -> parseExpression(Expr, dict:new()) end),
	
	{struct, Lets} = SharedLetConverted,
	lists:map(fun(Let) ->
		{LetName, LetStruct} = Let,
		LetNameString = binary_to_list(LetName),
		Reply = gen_server:call(?MODULE, {addLet, LetNameString, LetStruct}),
		?trace(Reply)
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
	NewState = dict:store(LetName, LetStruct, State),
    {reply, ok, NewState};
handle_call({evaluateTemplate, Name, Params}, _, State) ->
	Template = case dict:find(Name, State) of
		{ok, Found} -> Found;
		error -> throw("Error finding template: " ++ Name)
	end,
	Result = eval:evaluate(makeClosure(Template, scope:makeScope())),
	?trace(["Result: ", Result]),
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


evaluateLine(Line, Scope) ->
	Kind = binary_to_list(struct:get_value(<<"kind">>, Line)),
	case Kind of
		"lineExpr" ->
			Expr = (struct:get_value(<<"expr">>, Line)),
			?trace(["Binding expr: ", Expr]),
			Result = bindExpr(Expr, Scope),
			?trace([{"Done parsing expr: ", Expr}, {"Result:", Result}]),
			Result;
		"lineTemplate" ->
			makeClosure(Line, Scope);
		"lineJavascript" ->
			ignore;
		"lineXML" ->
			ignore;
		"lineState" ->
			ignore;
		"lineAction" ->
			ignore;
		"actionCreate" ->
			ignore
	end.
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

%% Convert a JSON expression to an expression using erlang records in deBruijn format
parseExpression({struct, [{<<"cons">>, <<"apply">>}, {<<"left">>, Left}, {<<"right">>, Right}]}, DeBruijnHash) ->
	ast:makeApply(parseExpression(Left, DeBruijnHash), parseExpression(Right, DeBruijnHash));
parseExpression({struct, [{<<"cons">>, <<"lambda">>}, {<<"left">>, Left}, {<<"right">>, Right}]}, DeBruijnHash) ->
	NewDeBruijnHash = dict:map(fun(Key, Value) -> Value + 1 end, DeBruijnHash),
	VarName = Left,
	NewerDeBruijnHash = dict:store(VarName, 1, NewDeBruijnHash),
	ast:makeLambda(parseExpression(Right, NewerDeBruijnHash));
parseExpression(Binary, DeBruijnHash) when is_binary(Binary) ->
	case dict:find(Binary, DeBruijnHash) of
		{ok, Index} ->
			ast:makeVariable(Index);
		error ->
			String = binary_to_list(Binary),
			case extractPrim(String) of
				error ->
					String;
				Prim ->
					ast:makeLiteral(Prim)
			end
	end.

%% run MapFunction on anything with name FieldName in JSON
mapFields({struct, List}, FieldName, MapFunction) -> 
	ConvertedList = lists:map(fun({Name, Value}) ->
		case Name of
			FieldName -> {Name, MapFunction(Value)};
			_ -> {Name, mapFields(Value, FieldName, MapFunction)}
		end
	end, List),
	{struct, ConvertedList};
mapFields(NonJSON, _, _) ->
	NonJSON.


bindExpr(Expr, Scope) -> 
	ast:mapStrings(Expr, fun(String) -> 
		case scope:lookup(Scope, String) of
			notfound ->
				globalStore:lookupPointer(String);
			Found -> Found
		end
	end).

executeAction() -> ok.

makeActionClosure() -> ok.

accumulate(SavedArgs, Fun, Expects) ->
	case length(SavedArgs) of
		Expects -> Fun(SavedArgs);
		_ -> fun (Arg) -> accumulate([Arg | SavedArgs], Fun, Expects) end
	end.

curry(Fun, Expects) ->
	accumulate([], Fun, Expects).

makeClosure(LineTemplate, ParentScope) ->
	Params = struct:get_value(<<"params">>, LineTemplate),
	Type = struct:get_value(<<"type">>, LineTemplate),
	ParamLength = length(Params),
	F = curry(fun(Args) -> 
		%make a new scope for this closure
		Scope = scope:makeScope(ParentScope),

		% add the arguments to the closure to the scope
		ArgsAndParams = lists:zip(Params, Args),
		lists:map(fun({Arg, Param}) -> 
			scope:addLet(Scope, binary_to_list(Param), Arg)
		end, ArgsAndParams),

		% add the lets in the closure to the scope lazily
		Lets = struct:get_value(<<"let">>, LineTemplate),
		LetsList = struct:to_list(Lets),
		
		lists:map(fun({LetName, LetValue}) -> 
			GetValue = fun() -> 
				?trace(["Evaluating lazy let: " , LetValue]),
				evaluateLine(LetValue, Scope)
			end,
			scope:addLazyLet(Scope, binary_to_list(LetName), GetValue)
		end, LetsList),
		
		% evaluate the output of the closure
		Output = struct:get_value(<<"output">>, LineTemplate),
		evaluateLine(Output, Scope)
	end, ParamLength),
	case ParamLength of
		0 -> F;
		_ -> #exprFun{function=F}
	end.

% Should have this somewhere
% parseExpression() -> ok.

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