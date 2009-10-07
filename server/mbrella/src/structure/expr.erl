-module (expr).
-compile(export_all).

-import (parse, [choice/2, choice/1, literal/0, identifier/0, failure/0,
 				boolean/0, null/0, natural/0, symbol/1, return/1, then/2, nest/3, alphaNum/0, float/0]).
-include ("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).


%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% 
%% exprParse:: String -> Expr
%%		Expr:: exprFun | exprCell | cons | String | Number | Bool | null
%% exprParse takes a string and returns an expression, an expression can then be fed into eval:evaluate
%% 

exprParse(String) ->
	EmptyEnv = fun(_) -> notfound end,
	%Throw away the environment, it is empty anyway
	{Result, _} = altparse:parse(String, EmptyEnv),
	Result.
exprParse(String, Env) ->
	altparse:parse(String, Env).

%% 
%% unparse:: Expr -> String
%% 

unparse(Expr) ->
	{String, _} = unparse(Expr, []),
	String.

%% ====================================================
%% Internal API
%% ====================================================

%% 
%% unparse:: Expr -> List -> {String, List}
%% 

unparse([], _) -> ok;
unparse(#exprApply{left = L, right = R} = Apply, Variables) when is_record(Apply, exprApply)->
	{LHS, Vars1} = unparse(L, Variables),
	{RHS, Vars2} = unparse(R, Vars1),
	if
		is_record(R, exprLambda) ->
			{LHS ++ " (" ++ RHS ++ ")", Vars2};
		is_record(R, exprApply) ->
			{LHS ++ " (" ++ RHS ++ ")", Vars2};
		is_record(R, exprFun) andalso R#exprFun.name =:= undefined ->
			{LHS ++ " (" ++ RHS ++ ")", Vars2};
		true ->
			{LHS ++ " " ++ RHS, Vars2}
	end;
unparse(#exprLambda{expr = Expr} = Lambda, Variables) when is_record(Lambda, exprLambda) ->
	{RHS, Vars1} = unparse(Expr, Variables),
	{"(\\ (" ++ RHS ++ "))", Vars1};
unparse(#exprFun{name = undefined, bottom = Bottom}, Variables) ->
	unparse(Bottom, Variables);	
unparse(#exprFun{name = Name}, Variables) ->
	{Name, Variables};
unparse(#funPointer{name = Name}, Variables) ->
	{Name, Variables};	
unparse(#exprCell{name = Name}, Variables) ->
	{Name, Variables};
unparse(#cellPointer{name = Name}, Variables) ->
	{Name, Variables};
unparse(#objectPointer{name = Name}, Variables) ->
	{Name, Variables};	
unparse(#object{name = Name}, Variables) ->
	{Name, Variables};
unparse(#exprVar{index = Index}, Variables) ->
	{"/" ++ integer_to_list(Index), Variables};
unparse(String, Variables) when is_list(String) ->
	{String, Variables};
unparse(Bool, Variables) when is_boolean(Bool) ->
	{atom_to_list(Bool), Variables};
unparse(Atom, Variables) when is_atom(Atom) ->
	{atom_to_list(Atom), Variables};
unparse(Number, Variables) ->
	{integer_to_list(Number), Variables}.

%% ====================================================
%% Utilities
%% ====================================================


is_string(String) ->
	Pred = fun(Number) ->
				if 
					Number < 0 -> false;
					Number > 255 -> false;
					true -> true
				end
			end,
	lists:all(Pred, String).

%% 
%% abstracted out for no reason code prettiness really...
%% 

lambdaVarLookup(String, Dict) ->
	try dict:fetch(String, Dict) 
	catch 
		_:_ -> notfound
	end.
	
lambdaVarStore(Key, Value, Dict) ->
	dict:store(Key, Value, Dict).