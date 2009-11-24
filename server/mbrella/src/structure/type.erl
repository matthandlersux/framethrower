-module (type).

-include ("../../include/scaffold.hrl").
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-export([makeApply/2, makeLambda/2, makeTypeVar/1, makeTypeName/1]).
-export([getApplyParam/1]).
-export([getTypeName/1]).
-export([parse/1, unparse/1, isReactive/1, outerType/1]).

%% ====================================================
%% types
%% ====================================================

% 	
% Type:
% 	{typeApply, {Type, Type}}
% | {typeFun, {Type, Type}}
% | {typeVar, String}
% | {typeName, TypeAtom}
%
% TypeAtom: TODO: add all types from client
%    unit | set | map | number | string | bool | null | ord
%


%%
%% make Functions
%%

% makeApply :: Type -> Type -> Type
makeApply(Left, Right) ->
	{typeApply, {Left, Right}}.

% makeLambda :: Type -> Type -> Type	
makeLambda(Left, Right) ->
	{typeFun, {Left, Right}}.

% makeTypeVar :: String -> Type
makeTypeVar(String) ->
	{typeVar, String}.



% makeTypeName :: (Atom | String) -> Type
makeTypeName(String) when is_list(String) ->
	{typeName, list_to_atom(parseUtil:toCamel(String))};
makeTypeName(Atom) when is_atom(Atom) ->
	{typeName, Atom}.

% getTypeName :: Type -> Atom
getTypeName({typeName, Atom}) -> Atom.


% getApplyParam :: Type -> Type
getApplyParam({typeApply, {Left, Right}}) ->
	Right.

%% 
%% parse:: String -> Type
%%

parse(S) ->
	{Result, _} = parser(S, empty),
	Result.

%% 
%% parser:: String -> (Type | empty) -> {Type, String}
%% Inputs: 
%%	  String: the String to be parsed
%%    LeftType: Type to be applied to the result of parsing String, or empty
%% Output: {Type, String}
%%    Type: the Type parsed from the input String
%%    String: the rest of the String not parsed yet

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

%
% extractTypeName :: String -> (TypeAtom | error)
%
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
		true -> list_to_atom(parseUtil:toCamel(String));
		false -> error
	end.



%% 
%% unparse:: Type -> String
%%

unparse(AST) ->
	{String, _} = unparse(AST, []),
	String.

%% 
%% unparse:: Type -> Variables -> {String, [Variables]}
%% Variables is a List of {String, String}, mapping variables in the type to normalized variable names

unparse([], _) -> ok;
unparse([{L,R}|T], Variables) ->
	{LHS, Vars1} = unparse(L, Variables),
	{RHS, Vars2} = unparse(R, Vars1),
	io:format("~s = ~s ~n~n", [LHS, RHS]),
	unparse(T, Vars2);
unparse({typeFun, {L, R} }, Variables) ->
	{String, Vars} = unparse(L, Variables),
	{String2, Vars2} = unparse(R, Variables ++ Vars),
	case L of
		{typeFun, _} ->
			{"(" ++ String ++ ") -> " ++ String2, Vars2};
		_ ->
			{String ++ " -> " ++ String2, Vars2}
	end;
unparse({typeApply, {L, R} }, Variables) ->
	{String, Vars} = unparse(L, Variables),
	{String2, Vars2} = unparse(R, Variables ++ Vars),
	case L of
		{typeFun, _} ->
			LHS = "(" ++ String ++ ")";
		_ -> 
			LHS = String
	end,
	case R of
		{typeApply, _} ->
			{LHS ++ " (" ++ String2 ++ ")", Vars2};
		{typeFun, _} ->
			{LHS ++ " (" ++ String2 ++ ")", Vars2};
		_ ->
			{LHS ++ " " ++ String2, Vars2}
	end;
unparse({typeName, Value}, Variables) ->
	unparse(parseUtil:toTitle(atom_to_list(Value)), Variables);
unparse({typeVar, Value}, Variables) ->
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
unparse(String, Variables) ->
	{String, Variables}.

%% 
%% isReactive :: Type -> Bool
%% returns true for any applied type (Unit, Set, Map)

isReactive(Type) ->
	case outerType(Type) of
		error -> false;
		_ -> true
	end.

%% 
%% outerType :: Type -> (Atom | error)
%% returns the kind of a reactiveType, so outerType(parse("Set (a -> Unit b)")) returns set
%% returns error for non reactive types

outerType({typeApply, {Type, _}}) ->
	case Type of
		{typeName, TypeAtom} -> TypeAtom;
		{typeApply, _} -> outerType(Type);
		_ -> error
	end;
outerType(_) -> error.

















%%
%% TODO: Everything below here needs to be updated for AST syntax and possibly pointer syntax in order to work
%% It would depend on keeping type information in the ASTs, which is not currently happening
%%
%%
%%
%%


%% 
%% getType:: Term -> Type
%% 

getType( AST ) ->
	getType( AST, dict:new() ).

getType( AST, Env ) ->
	case ast:type(AST) of
		apply -> 
			AST1 = prefixTypeVars( AST ),
			{Type, Constraints} = genConstraints( AST1 ),
			Subs = unify(Constraints),
			substitute(Type, Subs);
		function ->
			ast:getFunctionType(AST);
		variable ->
			case dict:find(ast:getVariable(AST), Env) of
				{ok, Result} -> Result;
				error -> erlang:error({typeVar_not_found, AST})
			end;
		cell -> ast:getCellType(AST);
		object -> ast:getObjectType(AST);
		Atom -> makeTypeName(Atom)
	end.


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
			Left = ast:getApplyFunctionArity1(Expr),
			Right = ast:getApplyParameterArity1(Expr),
			Env1 = maybeStore(Left, Variable, Env),
			Env2 = maybeStore(Right, Variable, Env1),
			{Type1, Constraints1} = genConstraints( Left, Prefix ++ "1", Env2),
			{Type2, Constraints2} = genConstraints( Right, Prefix ++ "2", Env2),
			{Variable, Constraints1 ++ Constraints2 ++ [{Type1, {typeFun, {Type2, Variable}}}]};
		lambda ->
			Variable = makeTypeVar("t" ++ Prefix),
			Left = ast:getApplyFunctionArity1(Expr),
			Right = ast:getApplyParameterArity1(Expr),
			Env1 = maybeStore(Left, Variable, Env),
			Env2 = maybeStore(Right, Variable, Env1),
			{Type1, Constraints1} = genConstraints( Right, Prefix ++ "3", Env2),
			{makeLambda(Variable, Type1), Constraints1}
	end.

%% 
%% maybeStore :: AST -> String -> Dict -> Dict
%%

maybeStore(AST, NewVar, Dict) ->
	case ast:type(AST) of
		variable ->
			OldVar = ast:getVariable(AST),
			case dict:find(OldVar, Dict) of
				error -> dict:store(OldVar, NewVar, Dict);
				_ -> Dict
			end;
		_ -> Dict
	end.
	
%% 
%% unify:: [Constraints] -> [Substitutions] | error
%% 

unify(Constraints) ->
	unify(Constraints, []).

unify([], Subs) -> Subs;
unify([{{Ltype, Lvalue} = L, {Rtype, Rvalue} = R}|Constraints], Substitutions) ->
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
%% containsVar:: TypeVar -> Type -> Bool
%% Does Type contain TypeVar
%% 

containsVar(TypeVar, {Type, Val}) ->
	case Type of
		typeName -> false;
		typeVar -> 
			{typeVar, TypeVarValue} = TypeVar,
			TypeVarValue =:= Val;
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
% substitute({L, R}, {VarName, Type}) ->
% 	{substitute(L, {VarName, Type}), substitute(R, {VarName, Type})};
substitute({Type, Val} = TypeRecord, {VarName, NewType} = Sub) ->
	case Type of 
		typeName -> TypeRecord;
		typeVar when Val =:= VarName ->
			% io:format("TypeRecord: ~p~nSubStitution: ~p~n~n", [TypeRecord, Sub]),
			% io:format( "Replaced: ~p~nwith: ~p~n~n", [TypeRecord, NewType]),
			NewType;
		typeVar ->
			TypeRecord;
		X when X =:= typeFun orelse X =:= typeApply ->
			{L,R} = Val,
			{Type, {substitute(L, Sub), substitute(R, Sub)}}
	end.


%% 
%% shiftVars:: Type -> String -> Type
%% 

shiftVars({Type, Value}, Prefix) ->
	case Type of
		typeFun -> 
			{Left, Right} = Value,
			{typeFun, {shiftVars(Left, Prefix), shiftVars(Right, Prefix)}};
		typeVar ->
			% io:format("~p -> ~p ~n~n", [Value, Value ++ Prefix]),
			{typeVar, Value ++ Prefix};
		typeName ->
			{typeName, shiftVars(Value, Prefix)};
		typeApply ->
			{Left, Right} = Value,
			{typeApply, {shiftVars(Left, Prefix), shiftVars(Right, Prefix)}}
	end;
% shiftVars({Left, Right}, Prefix) when is_atom(Left) -> %this is for typeName = String a type things, may need to change
% 	{Left, shiftVars(Right, Prefix)};
shiftVars(Anything, _) ->
	Anything.



	
%% 
%% prefixTypeVars:: Expr -> Expr
%% 

prefixTypeVars( Expr ) ->
	prefixTypeVars( Expr, "" ).

prefixTypeVars( #exprApply{ left = Left, right = Right } = Apply, Index ) when is_record( Apply, exprApply ) ->
	Apply#exprApply{ left = prefixTypeVars(Left, Index ++ "x"), right = prefixTypeVars(Right, Index ++ "y") };
prefixTypeVars( #exprLambda{ expr = Expr} = Lambda, _Index ) when is_record( Lambda, exprLambda ) ->
	Lambda#exprLambda{ expr = prefixTypeVars(Expr, "z") };
prefixTypeVars(#exprFun{ type = Type } = ExprFun, Index ) when is_record( ExprFun, exprFun ) ->
	ExprFun#exprFun{ type = shiftVars(Type, Index) };
prefixTypeVars( #exprCell{ type = Type } = ExprCell, Index ) when is_record( ExprCell, exprCell ) ->
	ExprCell#exprFun{ type = shiftVars(Type, Index) };
prefixTypeVars( Expr, _ ) -> Expr.
	
	
	
bindVars(Explicit, {TemplateKind, TemplateValue}, TypeVars) ->
	if
		TemplateKind == typeVar -> dict:store(TemplateValue, Explicit, TypeVars);
		(TemplateKind == typeApply) or (TemplateKind == typeLambda) ->
			{_, {ELeft, ERight}} = Explicit,
			{TLeft, TRight} = TemplateValue,
			NewTypeVars = bindVars(ELeft, TLeft, TypeVars),
			bindVars(ERight, TRight, NewTypeVars);
		true -> TypeVars
	end.
	
build({TypeKind, TypeValue} = Type, TypeVars) ->
	case TypeKind of
		typeVar -> dict:fetch(TypeValue, TypeVars);
		typeName -> Type;
		_ -> 
			{Left, Right} = TypeValue,
			{TypeKind, {build(Left, TypeVars), build(Right, TypeVars)}}
	end.
	
buildType(ExplicitType, TemplateTypeString, TypeToBuildString) ->
	TemplateType = parse(TemplateTypeString),
	TypeToBuild = parse(TypeToBuildString),
	
	TypeVars = bindVars(ExplicitType, TemplateType, dict:new()),
	build(TypeToBuild, TypeVars).
	
	

compareHelper({Type1Kind, Type1Value}, {Type2Kind, Type2Value}, Correspond12, Correspond21) ->
	case Type1Kind of
		WrongType when not(WrongType == Type2Kind) -> {false, Correspond12, Correspond21};
		typeName -> {(Type1Value == Type2Value), Correspond12, Correspond21};
		typeVar -> 
			T1C12 = dict:fetch(Type1Value, Correspond12),
			C12 = (not T1C12) orelse (T1C12 == Type2Value),
			T2C21 = dict:fetch(Type2Value, Correspond21),
			C21 = (not T2C21) orelse (T2C21 == Type1Value),
			case (C12 and C21) of
				true -> 
					NewCorrespond12 = dict:store(Type1Value, Type2Value, Correspond12),
					NewCorrespond21 = dict:store(Type2Value, Type1Value, Correspond21),
					{true, NewCorrespond12, NewCorrespond21};
				false -> {false, Correspond12, Correspond21}
			end;
		_ -> 
			{Left1, Right1} = Type1Value,
			{Left2, Right2} = Type2Value,
			{Comp1, NewCorrespond12, NewCorrespond21} = CH1 = compareHelper(Left1, Left2, Correspond12, Correspond21),
			case Comp1 of
				true -> compareHelper(Right1, Right2, NewCorrespond12, NewCorrespond21);
				false -> CH1
			end
	end.
	
compareTypes(Type1, Type2) ->
	{Answer, _, _} = compareHelper(Type1, Type2, dict:new(), dict:new()),
	Answer.

