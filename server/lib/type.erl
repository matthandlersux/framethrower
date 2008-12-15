-module (type).
-compile( export_all).

-include ("ast.hrl").

get(String) ->
	{Type, Constraints} = genConstraints( expr:expr( parse:ast( String ) ) ),
	Subs = unify(Constraints),
	unparse(substitute(Type, Subs)).
	
%% 
%% Expr:: string | bool | num | (Expr) | Expr -> Expr | exprFun | exprVar
%% Type:: String | Bool | Num | {Type} | Type -> Type | [Type] | typeVar
%% 


%% 
%% getType:: Expr -> Type
%% 

getType( Expr ) ->
	getType( Expr, expr:getEnv(default) ).
	
getType( Expr, Env ) when is_record(Expr, exprFun) ->
	Expr#exprFun.type;
getType( Expr, Env ) when is_record(Expr, exprVar) ->
	try dict:fetch(Expr#exprVar.value, Env)
		% {TypeString, _Fun} -> type(typeVar, parse:tast( TypeString ))
	catch _:_ -> erlang:error({typeVar_not_found, Expr})
	end;
getType( Expr, _ ) when is_boolean(Expr) -> type(bool);
getType( Expr, _ ) when is_number(Expr) -> type(num);
getType( Expr, _ ) -> type(string).


%% 
%% genConstraints:: Expr -> {Type, [Constraints]}
%% 
genConstraints(Expr) ->
	Env = expr:getEnv(default),
	genConstraints(Expr, "1", Env).

genConstraints(Expr, Prefix, Env) ->
	case exprType(Expr) of
		exprVar ->
			{getType(Expr, Env), []};
		expr ->
			{getType( Expr, Env ), []};
		apply ->
			Variable = type(typeVar, "t" ++ Prefix),
			Env1 = maybeStore(Expr#cons.left, Variable, Env),
			Env2 = maybeStore(Expr#cons.right, Variable, Env1),
			{Type1, Constraints1} = genConstraints( Expr#cons.left, Prefix ++ "1", Env2),
			{Type2, Constraints2} = genConstraints( Expr#cons.right, Prefix ++ "2", Env2),
			{Variable, Constraints1 ++ Constraints2 ++ [{Type1, {type, typeFun, {Type2, Variable}}}]};
		lambda ->
			Variable = type(typeVar, "t" ++ Prefix),
			Env1 = maybeStore(Expr#cons.left, Variable, Env),
			Env2 = maybeStore(Expr#cons.right, Variable, Env1),
			{Type1, Constraints1} = genConstraints( Expr#cons.right, Prefix ++ "3", Env2),
			{type(lambda, Variable, Type1), Constraints1}
	end.

%% 
%% maybeStore:: Expr -> FreshVariable -> Env -> Env
%% 

maybeStore(#exprVar{value = OldVar} = Expr, NewVar, Env) when is_record(Expr, exprVar) ->
	try dict:fetch(OldVar, Env) of
		_ -> Env
	catch 
		_:_ -> dict:store(OldVar, NewVar, Env)
	end;
maybeStore(_, _, Env) -> Env.

%% 
%% type returns a well formed type tuple
%% 
	
type(bool) -> {type, bool, null};
type(num) -> {type, num, null};
type(string) -> {type, string, null}.

type(typeVar, Val) -> {type, typeVar, Val};
type(typeFun, String) -> String.

type(lambda, Var, Type) -> {type, typeFun, {Var, Type}}.

%% 
%% exprType returns the type of an expression record, this is a hack so i dont have to convert my cons in expr
%% 

exprType(Expr) when is_record(Expr, cons) -> Expr#cons.type;
exprType(Expr) when is_record(Expr, exprVar) -> exprVar;
exprType(_) -> expr.

	
%% 
%% unify:: [Constraints] -> [Substitutions] | error
%% 

unify(Constraints) ->
	unify(Constraints, []).

unify([], Subs) -> Subs;
unify([{#type{type = Ltype, value = Lvalue} = L, #type{type = Rtype, value = Rvalue} = R}|Constraints], Substitutions) ->
	LCR = containsVar(L, R),
	RCL = containsVar(R, L),
	% io:format("~p~n~n", [unparse(Substitutions)]),
	if
		Ltype =:= typeName, Rtype =:= typeName ->
			if
				Lvalue =:= Rvalue -> unify(Constraints, Substitutions);
				true -> erlang:error({typeName_mismatch, {Lvalue, Rvalue}})
			end;
		Ltype =:= typeVar, Rtype =:= typeVar, Lvalue =:= Rvalue ->
			unify(Constraints, Substitutions);
		Ltype =:= typeVar, RCL =:= false ->
			Sub = {Lvalue, R},
			unify( substitute(Constraints, Sub), Substitutions ++ [Sub]);
		Rtype =:= typeVar, LCR =:= false ->
			Sub = {Rvalue, L},
			unify( substitute(Constraints, Sub), Substitutions ++ [Sub]);
		Rtype =:= Ltype ->
			{LL, LR} = Lvalue,
			{RL, RR} = Rvalue,
			unify( Constraints ++ [{LL, RL}, {LR, RR}], Substitutions );
		true ->
			erlang:error({type_mismatch, {L, R}})
	end.
	

%% 
%% containsVar:: Does #type contain TypeVar
%% 

containsVar(TypeVar, #type{type = Type, value = Val}) ->
	case Type of
		typeName -> false;
		typeVar -> TypeVar#type.value =:= Val;
		_ -> 
			{L, R} = Val,
			containsVar(TypeVar, L) orelse containsVar(TypeVar, R)
	end.

%% 
%% substitute:: [{String, Type}] -> Expr -> Expr
%% 

substitute(Expr, []) -> Expr;
substitute(Expr, [H|T]) ->
	substitute( substitute(Expr, H), T );
substitute([], {_VarName, _Type}) -> [];
substitute([H|T], {VarName, Type}) ->
	[substitute(H, {VarName, Type})|substitute(T, {VarName, Type})];
substitute({L, R}, {VarName, Type}) ->
	{substitute(L, {VarName, Type}), substitute(R, {VarName, Type})};
substitute(#type{type = Type, value = Val} = TypeRecord, {VarName, NewType} = Sub) ->
	case Type of 
		typeName -> TypeRecord;
		typeVar when Val =:= VarName ->
			% io:format("TypeRecord: ~p~nSubStitution: ~p~n~n", [TypeRecord, Sub]),
			% io:format( "Replaced: ~p~nwith: ~p~n~n", [TypeRecord, NewType]),
			NewType;
		typeVar ->
			TypeRecord;
		X when X =:= typeFun orelse X =:= typeApply ->
			{L,R} = TypeRecord#type.value,
			#type{type = Type, value = {substitute(L, Sub), substitute(R, Sub)}}
	end.


%% 
%% shiftVars:: AST -> String -> AST
%% 

shiftVars(#type{type = Type, value = Value} = TypeExpr, Prefix) when is_record(TypeExpr, type) ->
	case Type of
		typeFun -> 
			{Left, Right} = Value,
			#type{type = typeFun, value = {shiftVars(Left, Prefix), shiftVars(Right, Prefix)}};
		typeVar ->
			% io:format("~p -> ~p ~n~n", [Value, Value ++ Prefix]),
			TypeExpr#type{value = Value ++ Prefix};
		typeName ->
			TypeExpr#type{value = shiftVars(Value, Prefix)};
		typeApply ->
			{Left, Right} = Value,
			#type{type = typeApply, value = {shiftVars(Left, Prefix), shiftVars(Right, Prefix)}}
	end;
shiftVars({Left, Right}, Prefix) when is_atom(Left) -> %this is for typeName = String a type things, may need to change
	{Left, shiftVars(Right, Prefix)};
shiftVars(Anything, _) ->
	Anything.
	

%% 
%% unparse:: AST -> {String, [Variables]}
%% 
unparse(AST) when is_list(AST) ->
	unparse(AST, []);
unparse(AST) ->
	{String, _} = unparse(AST, []),
	String.

unparse([], _) -> ok;
unparse([{L,R}|T], Variables) ->
	{LHS, Vars1} = unparse(L, Variables),
	{RHS, Vars2} = unparse(R, Vars1),
	io:format("~s = ~s ~n~n", [LHS, RHS]),
	unparse(T, Vars2);
unparse(#type{type = typeFun, value = {L, R} }, Variables) ->
	{String, Vars} = unparse(L, Variables),
	{String2, Vars2} = unparse(R, Variables ++ Vars),
	case L of
		#type{type = typeFun} ->
			{"(" ++ String ++ ") -> " ++ String2, Vars2};
		_ ->
			{String ++ " -> " ++ String2, Vars2}
	end;
unparse(#type{type = typeApply, value = {L, R} }, Variables) ->
	{String, Vars} = unparse(L, Variables),
	{String2, Vars2} = unparse(R, Variables ++ Vars),
	case R of
		#type{type = typeApply} ->
			{String ++ " (" ++ String2 ++ ")", Vars2};
		_ ->
			{String ++ " " ++ String2, Vars2}
	end;
unparse(#type{type = typeName, value = Value}, Variables) ->
	unparse(atom_to_list(Value), Variables);
unparse(#type{type = typeVar, value = Value}, Variables) ->
	case lists:keysearch(Value, 1, Variables) of
		{value, {_, ChangeTo}} ->
			unparse(ChangeTo, Variables);
		false ->
			case Variables of
				[] -> unparse( "a", Variables ++ [{Value, "a"}]);
				_ ->
					{_, [LastVar]} = lists:last(Variables),
					unparse( [LastVar + 1], Variables ++ [{Value, [LastVar + 1]}])
			end
	end;
% unparse(#type{type = typeVar, value = Value}, Variables) ->
% 	unparse(Value, Variables);
unparse(String, Variables) ->
	{String, Variables}.
%% 
%% solutions:: {[Substitution], Type}
%% 