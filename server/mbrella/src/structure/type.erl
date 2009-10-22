-module (type).
-compile( export_all).

-import (mblib, [maybeStore/3]).

-include ("ast.hrl").
-include ("../../include/scaffold.hrl").
-define (do(X, Y, Next), then( Y, fun(X) -> Next end )).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).


%% ====================================================
%% types
%% ====================================================

% Expr:
% 	#exprLambda | #exprApply |	#exprFun | #exprCell | #exprVar | String | Num | Bool
% 	
% Type:
% 	#type
% 	

-record (cons, {type, left, right}).

%% ====================================================
%% external api
%% ====================================================


%%
%% make Functions
%%


% makeApply :: Type -> Type -> Type
makeApply(Left, Right) ->
	{type, typeApply, {Left, Right}}.

% makeApply :: Type -> Type -> Type	
makeLambda(Left, Right) ->
	{type, typeFun, {Left, Right}}.

% makeApply :: String -> Type
makeTypeVar(String) ->
	{type, typeVar, String}.

% makeApply :: String -> Type
makeTypeName(String) ->
	{type, typeName, String}.



%% 
%% parse:: String -> Type
%%

parse(S) ->
	{Result, _} = parser(S, empty),
	Result.

%% 
%% parser:: String -> Type -> {Type, String}
%%

parser(String, LeftType) ->
	{LeftTypeUsed, Type, Remaining} = case String of
		[$(|Right] ->
			{ParsedType, [$)|Rest]} = parser(parseUtil:trimSpace(Right), empty),
			{notused, ParsedType, parseUtil:trimSpace(Rest)};
		[$-|[$>|Right]] ->
			{ParsedType, Rest} = parser(parseUtil:trimSpace(Right), empty),
			{used, makeLambda(LeftType, ParsedType), Rest};
		_ -> %string
			{StringToParse, Rest} = parseUtil:untilSpaceOrRightParen(String),
			ParsedString = case extractTypeName(StringToParse) of
				error ->
					makeTypeVar(StringToParse);
				TypeAtom ->
					makeTypeName(TypeAtom)
			end,
			{notused, ParsedString, Rest}
	end,
	NewType = case {LeftTypeUsed, LeftType} of
		{_, empty} -> Type;
		{used, _} -> Type;
		{notused, _} -> makeApply(LeftType, Type)
	end,
	case Remaining of
		[] -> {NewType, []};
		[$)|_] -> {NewType, Remaining};
		_ -> parser(Remaining, NewType)
	end.


extractTypeName(String) ->
	IsTypeName = case String of
		"Set" -> true;
		"Unit" -> true;
		"Map" -> true;
		"Number" -> true;
		"String" -> true;
		"Null" -> true;
		"Bool" -> true;
		"Ord" -> true;
		% TODO: insert ALL needed types from client
		_ -> false
	end,
	case IsTypeName of
		true -> list_to_atom(string:to_lower(String));
		false -> error
	end.



%% ====================================================
%% Internal API
%% ====================================================




	
%% 
%% Expr:: string | bool | num | (Expr) | Expr -> Expr | exprFun | exprVar
%% Type:: String | Bool | Num | {Type} | Type -> Type | [Type] | typeVar
%% 
	

%% 
%% unparse:: Type -> {String, [Variables]}
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
	case L of
		#type{type = typeFun} ->
			LHS = "(" ++ String ++ ")";
		_ -> 
			LHS = String
	end,
	case R of
		#type{type = typeApply} ->
			{LHS ++ " (" ++ String2 ++ ")", Vars2};
		#type{type = typeFun} ->
			{LHS ++ " (" ++ String2 ++ ")", Vars2};
		_ ->
			{LHS ++ " " ++ String2, Vars2}
	end;
unparse(#type{type = typeName, value = Value}, Variables) ->
	unparse(parseUtil:toTitle(atom_to_list(Value)), Variables);
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


isReactive(Type) ->
	case outerType(Type) of
		false -> false;
		_ -> true
	end.

outerType(#type{type = typeApply, value = {Val, _}}) ->
	case Val of
		#type{type = typeName, value = unit} -> unit;
		#type{type = typeName, value = set} -> set;
		#type{type = typeApply, value = {#type{type = typeName, value = map},_}} -> map;
		_ -> false
	end;
outerType(_) -> false.


isMap(#type{type = typeApply, value = {#type{type = typeName, value = map}, _}}) ->
	true;
isMap(_) -> false.































%%
%% TODO: Everything below here needs to be updated for AST syntax and possibly pointer syntax in order to work
%% It would depend on keeping type information in the ASTs, which is not currently happening
%%
%%
%%
%%

%% 
%% get:: Expr -> Type | Error
%% 

get( Expr ) ->
	Expr1 = prefixTypeVars( Expr ),
	{Type, Constraints} = genConstraints( Expr1 ),
	Subs = unify(Constraints),
	substitute(Type, Subs).



%% 
%% getType:: Expr -> Type
%% 

getType( Expr ) ->
	getType( Expr, dict:new() ).
	
getType( Expr, _ ) when is_record(Expr, exprFun) ->
	% io:format("~100p~n~n", [unparse(Expr#exprFun.type)]),
	Expr#exprFun.type;
getType( Expr, Env ) when is_record(Expr, exprVar) ->
	try dict:fetch(Expr#exprVar.index, Env)
		% {TypeString, _Fun} -> type(typeVar, parse:tast( TypeString ))
	catch _:_ ->
		case cellStore:lookup(Expr#exprVar.index) of
			notfound -> erlang:error({typeVar_not_found, Expr});
			Result -> Result
		end
	end;
getType( Expr, _ ) when is_record(Expr, exprCell) ->
	Expr#exprCell.type;
getType( Obj, _ ) when is_record(Obj, object) ->
	Obj#object.type;
getType({primitive, Type, _}, _) -> 
	makeTypeName(Type);
getType({primitive, null}, _) -> makeTypeName(null);
getType( Expr, _ ) when is_boolean(Expr) -> makeTypeName(bool);
getType( null, _ ) -> makeTypeName(null);
getType( Expr, _ ) when is_number(Expr) -> makeTypeName(number);
getType( Expr, _ ) when is_list(Expr) -> makeTypeName(string).

%% TODO: use correct AST functions/syntax
%% genConstraints:: Expr -> {Type, [Constraints]}
%% 
genConstraints(Expr) ->
	%Env = expr:getEnv(default),
	Env = dict:new(),
	genConstraints(Expr, "1", Env).

genConstraints(Expr, Prefix, Env) ->
	case ast:type(Expr) of
		exprVar ->
			{getType(Expr, Env), []};
		expr ->
			% io:format("~p~n~n", [Expr]),
			{getType( Expr, Env ), []};
		apply ->
			Variable = makeTypeVar("t" ++ Prefix),
			Env1 = maybeStore(Expr#cons.left, Variable, Env),
			Env2 = maybeStore(Expr#cons.right, Variable, Env1),
			{Type1, Constraints1} = genConstraints( Expr#cons.left, Prefix ++ "1", Env2),
			{Type2, Constraints2} = genConstraints( Expr#cons.right, Prefix ++ "2", Env2),
			{Variable, Constraints1 ++ Constraints2 ++ [{Type1, {type, typeFun, {Type2, Variable}}}]};
		lambda ->
			Variable = makeTypeVar("t" ++ Prefix),
			Env1 = maybeStore(Expr#cons.left, Variable, Env),
			Env2 = maybeStore(Expr#cons.right, Variable, Env1),
			{Type1, Constraints1} = genConstraints( Expr#cons.right, Prefix ++ "3", Env2),
			{makeLambda(Variable, Type1), Constraints1}
	end.



	
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

containsVar(TypeVar, #type{type = Type, value = Val} = TypeRec) when is_record(TypeRec, type) ->
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
%% prefixTypeVars:: Expr -> Expr
%% 

prefixTypeVars( Expr ) ->
	prefixTypeVars( Expr, "" ).

prefixTypeVars( #exprApply{ left = Left, right = Right } = Apply, Index ) when is_record( Apply, exprApply ) ->
	Apply#exprApply{ left = prefixTypeVars(Left, Index ++ "x"), right = prefixTypeVars(Right, Index ++ "y") };
prefixTypeVars( #exprLambda{ expr = Expr} = Lambda, Index ) when is_record( Lambda, exprLambda ) ->
	Lambda#exprLambda{ expr = prefixTypeVars(Expr, "z") };
prefixTypeVars(#exprFun{ type = Type } = ExprFun, Index ) when is_record( ExprFun, exprFun ) ->
	ExprFun#exprFun{ type = shiftVars(Type, Index) };
prefixTypeVars( #exprCell{ type = Type } = ExprCell, Index ) when is_record( ExprCell, exprCell ) ->
	ExprCell#exprFun{ type = shiftVars(Type, Index) };
prefixTypeVars( Expr, _ ) -> Expr.
	
	
	
bindVars(Explicit, Template, TypeVars) ->
	if
		Template#type.type == typeVar -> dict:store(Template#type.value, Explicit, TypeVars);
		(Template#type.type == typeApply) or (Template#type.type == typeLambda) ->
			{ELeft, ERight} = Explicit#type.value,
			{TLeft, TRight} = Template#type.value,
			NewTypeVars = bindVars(ELeft, TLeft, TypeVars),
			bindVars(ERight, TRight, NewTypeVars);
		true -> TypeVars
	end.
	
build(Type, TypeVars) ->
	case Type#type.type of
		typeVar -> dict:fetch(Type#type.value, TypeVars);
		typeName -> Type;
		Kind -> 
			{Left, Right} = Type#type.value,
			#type{type=Kind, value={build(Left, TypeVars), build(Right, TypeVars)}}
	end.
	
buildType(ExplicitType, TemplateTypeString, TypeToBuildString) ->
	TemplateType = parse(TemplateTypeString),
	TypeToBuild = parse(TypeToBuildString),
	
	TypeVars = bindVars(ExplicitType, TemplateType, dict:new()),
	build(TypeToBuild, TypeVars).
	
	

compareHelper(Type1, Type2, Correspond12, Correspond21) ->
	case Type1#type.type of
		WrongType when not(WrongType == Type2#type.type) -> {false, Correspond12, Correspond21};
		typeName -> {(Type1#type.value == Type2#type.value), Correspond12, Correspond21};
		typeVar -> 
			T1C12 = dict:fetch(Type1#type.value, Correspond12),
			C12 = (not T1C12) orelse (T1C12 == Type2#type.value),
			T2C21 = dict:fetch(Type2#type.value, Correspond21),
			C21 = (not T2C21) orelse (T2C21 == Type1#type.value),
			case (C12 and C21) of
				true -> 
					NewCorrespond12 = dict:store(Type1#type.value, Type2#type.value, Correspond12),
					NewCorrespond21 = dict:store(Type2#type.value, Type1#type.value, Correspond21),
					{true, NewCorrespond12, NewCorrespond21};
				false -> {false, Correspond12, Correspond21}
			end;
		_ -> 
			{Left1, Right1} = Type1#type.value,
			{Left2, Right2} = Type2#type.value,
			{Comp1, NewCorrespond12, NewCorrespond21} = CH1 = compareHelper(Left1, Left2, Correspond12, Correspond21),
			case Comp1 of
				true -> compareHelper(Right1, Right2, NewCorrespond12, NewCorrespond21);
				false -> CH1
			end
	end.
	
compareTypes(Type1, Type2) ->
	{Answer, _, _} = compareHelper(Type1, Type2, dict:new(), dict:new()),
	Answer.

