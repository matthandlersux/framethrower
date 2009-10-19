-module (type).
-compile( export_all).

-import (mblib, [maybeStore/3]).

-include ("ast.hrl").
-include ("../../include/scaffold.hrl").
-define (do(X, Y, Next), then( Y, fun(X) -> Next end )).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).


% get( String ) when is_list( String ) ->
% 	type:get( expr:expr(String) );

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
%% get:: Expr -> Type | Error
%% 

get( Expr ) ->
	Expr1 = prefixTypeVars( Expr ),
	{Type, Constraints} = genConstraints( Expr1 ),
	Subs = unify(Constraints),
	substitute(Type, Subs).

%% 
%% show:: String | Expr -> String
%% 
	
show( String ) when is_list( String ) ->
	show( parse:parse(String) );
show( Expr ) ->
	unparse( type:get(Expr) ).
	
%% 
%% parse:: String -> Type
%% 

parse(String) ->
	case parse( control(), String) of
		[{Result, []}] -> Result;
		[{Result, Leftovers}] -> io:format("unused input \"~s\"~n~nresult: ~p~n", [Leftovers, Result]);
		[] -> io:format("invalid input ~n", [])
	end.

%% ====================================================
%% Internal API
%% ====================================================



%% ====================================================
%% type parser CFG
%% ====================================================

	
control() ->
	?do(T, elem(),
		choice(
			?do( _, symbol("->"),
			?do( E, control(),
			return({type, typeFun, {T, E}}))), %or
			return(T)
		)
	).

elem() ->
	choice(
		?do( LeftMost, elem1(),
			choice(
				nest(LeftMost, term(), fun(X,Acc) -> {type, typeApply, {Acc, X}} end), %or
				return( LeftMost )
			)
		), %or
		term()
	).

elem1() ->
	?do(Left, term(),
	?do(Right, term(),
	return({type, typeApply, {Left, Right}}))).

term() ->
	choice([
		?do(_, symbol("("),
		?do(E, control(),
		?do(_, symbol(")"),
		return(E)))), %or
		?do(Type, type(), return({type, typeName, list_to_atom(Type)})), %or
		?do(TypeVar, typeVar(), return({type, typeVar, TypeVar}) )
	]).
	
%% 
%% Expr:: string | bool | num | (Expr) | Expr -> Expr | exprFun | exprVar
%% Type:: String | Bool | Num | {Type} | Type -> Type | [Type] | typeVar
%% 


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
% getType( Expr, Env ) when is_record(Expr, cellPointer) ->
	%
getType( Expr, Env ) when is_record(Expr, exprCell) ->
	Expr#exprCell.type;
getType( Obj, Env ) when is_record(Obj, object) ->
	Obj#object.type;
getType({primitive, Type, _}, _) -> 
	case Type of
		bool -> type(bool);
		nat -> type(num);
		string -> type(string)
	end;
getType({primitive, null}, _) -> type(null);
getType( Expr, _ ) when is_boolean(Expr) -> type(bool);
getType( null, _ ) -> type(null);
getType( Expr, _ ) when is_number(Expr) -> type(num);
getType( "<" ++ _ = XML, _) when is_list(XML) -> type(xml);
getType( Expr, _ ) when is_list(Expr) -> type(string).


%% 
%% genConstraints:: Expr -> {Type, [Constraints]}
%% 
genConstraints(Expr) ->
	%Env = expr:getEnv(default),
	Env = dict:new(),
	genConstraints(Expr, "1", Env).

genConstraints(Expr, Prefix, Env) ->
	case exprType(Expr) of
		exprVar ->
			{getType(Expr, Env), []};
		expr ->
			% io:format("~p~n~n", [Expr]),
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
%% type returns a well formed type tuple
%% 
	
type(bool) -> {type, typeName, 'Bool'};
type(null) -> {type, typeName, 'Null'};
type(num) -> {type, typeName, 'Number'};
type(string) -> {type, typeName, 'String'};
type(xml) -> {type, typeName, 'XML'}.

type(typeVar, Val) -> {type, typeVar, Val};
type(typeFun, String) -> String.

type(lambda, Var, Type) -> {type, typeFun, {Var, Type}}.

%% 
%% exprType returns the type of an expression record, this is a hack so i dont have to convert my cons in expr
%% 

exprType(Expr) when is_record(Expr, cons) -> Expr#cons.type;
exprType(Expr) when is_record(Expr, exprApply) -> apply;
exprType(Expr) when is_record(Expr, exprLambda) -> lambda;
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


isReactive(Type) ->
	case outerType(Type) of
		false -> false;
		_ -> true
	end.

outerType(#type{type = typeApply, value = {Val, _}}) ->
	case Val of
		#type{type = typeName, value = 'Unit'} -> unit;
		#type{type = typeName, value = 'Set'} -> set;
		#type{type = typeApply, value = {#type{type = typeName, value = 'Map'},_}} -> map;
		_ -> false
	end;
outerType(_) -> false.


isMap(#type{type = typeApply, value = {#type{type = typeName, value = 'Map'}, _}}) ->
	true;
isMap(_) -> false.

	
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




%% ====================================================
%% Stuff from old parse file
%% ====================================================
%% ====================================================
%% Stuff from old parse file
%% ====================================================

%% ====================================================
%% Parser
%% ====================================================

%% 
%% Ast :: List(Tuple(X, Y)) | List()
%% 
%% 
%% Parser :: ¬ String -> Ast
%% 


%% 
%% return X -> ¬ Y -> Ast
%% 

return(Ast) ->
	fun(String) -> [{Ast, String}] end.
%% 
%% failure -> ¬ X -> Ast
%% 

failure() ->
	fun(_String) -> [] end.

%% 
%% item -> ¬ String -> Ast
%% 

item() ->
	fun(String) ->
		case String of
			[] -> [];
			[H|T] -> [{H, T}]
		end
	end.

%% 
%% parser (Parser A) String -> Ast
%% 

parse(Parser, String) ->
	Parser(String).

%% 
%% then (Parser A) (¬ Parser B) -> Ast		¬ Parser B = ¬ String -> Parser B
%% 		the monadic part is that you can compose parsers into a new parser

then(Parser, FunToParser) ->
	fun(String) ->
		case parse(Parser, String) of
			[] -> [];
			[{H, Tail}] -> parse( FunToParser(H), Tail )
		end
	end.

%% 
%% choice (Parser A) (Parser B) -> Ast
%% 

choice(Parser1, Parser2) ->
	fun(String) ->
		case parse(Parser1, String) of
			[] -> parse(Parser2, String);
			[{H, Tail}] -> [{H, Tail}]
		end
	end.

choice([]) -> failure();
choice([H|T]) ->
	choice(H, choice(T)).


%% 
%% nest:: FirstElement -> Parser -> Fun -> Parser
%%		nest was my solution to the left associativity of Apply's.  This could be a slow process but essentially it
%%		returns a parser that takes the first element of something that is left associative (LeftMost) and then 
%%		looks to see if there are more of those left associative elements to the right of it... it 
%%		then folds NestFun on the elements that were parsed out so that you have for example:
%%
%%		nest(apply1, apply(),  fun(X, Acc) -> {cons, apply, Acc, X} end) -> Parser st.
%%			parse(Parser, "apply2 apply3 apply4 apply5") ->
%%				((((apply1 apply2) apply3) apply4) apply5)
%% 

	
nest(LeftMost, Parser, NestFun) ->
	fun(String) ->
		case nestList(Parser, String) of
			[] -> [];
			[{ElemList, Tail}] -> [{lists:foldl(NestFun, LeftMost, ElemList), Tail}]
		end			
	end.
	
nestList(Parser, String) ->
	nestList(Parser, [], String).
	
nestList(Parser, Acc, String) -> 
		case parse(Parser, String) of
			[] -> [{Acc, String}];
			[{H, Tail}] -> nestList(Parser, Acc ++ [H], Tail)
		end.

%% 
%% sat (Char -> Bool) -> (¬ Y -> Ast)
%% 

% do(X,Y,Z) says Parse a Y off the string and then take Z and make a parser out of it that includes Y in some way

sat(Predicate) ->
	?do( X, item(),
		case Predicate(X) of
			true -> return(X);
			false -> failure()
		end).

%% 
%% notSat (Char -> Bool) -> (¬ Y -> Ast)
%% 
	
notSat(Predicate) ->
	?do( X, item(),
		case Predicate(X) of
			true -> failure();
			false -> return(X)
		end
	).

many(Parser) ->
	choice( many1(Parser), return([]) ).

many1(Parser) ->
	?do(V, Parser, 
	?do(VS, many(Parser), 
	return([V|VS]))).

token(Parser) ->
	?do( _, space(),
	?do(V, Parser,
	?do(_, space(),
	return(V)))).
		
% p() ->
% 	then( symbol("("), fun(_) ->
% 			then( natural(), fun(N) ->
% 					then( many( then( symbol(","), fun(_) -> natural() end )), fun(NS) ->
% 						then( symbol(")"), fun(_) ->
% 								return([N|NS])
% 							end)
% 					end)
% 			end)
% 	end).



%% ====================================================
%% utilities
%% ====================================================

%% 
%% parsers
%% 

digit() ->
	sat(fun isDigit/1).

lower() ->
	sat(fun isLower/1).

upper() ->
	sat(fun isUpper/1).

letter() ->
	sat(fun isAlpha/1).

bool() ->
	choice(
		string("true"),
		string("false")
	).
	
nul() ->
	string("null").

alphaNum() ->
	sat(fun isAlphaNum/1).

alphaNumSpace() ->
	sat(fun isAlphaNumSpace/1).

alphaNumPunc() ->
	sat(fun isAlphaNumPunc/1).

char(Char) ->
	sat(isChar(Char)).

string([]) ->
	return([]);
string([H|T] = String) ->
	then(char(H), fun(_) -> 
				then( string(T), fun(_) ->
					return(String)
				end
				)
		end
	).

quotable() ->
	many( choice(
		notSat(isChar($")), %or
		symbol("\\\"")
	)).

lit() ->
	?do(_, symbol([$"]),
	?do(Literal, quotable(),
	?do(_, symbol([$"]),
	return(Literal)))).
	% return([$"] ++ Literal ++ [$"])))).

ident() ->
	?do(X, letter(),
	?do(XS, many( alphaNumPunc() ),
	return([X|XS]))).
	
typ() ->
	?do(X, upper(),
	?do(XS, many( alphaNumPunc() ),
	return([X|XS]))).
	
typeW() ->
	?do(X, upper(),
	?do(Z, many( alphaNum() ),
	?do(Y, typeVar(),
	return([X|Y])))).
	
nat() ->
	choice( 
		?do( XS, many1( digit() ),
		return(list_to_integer(XS)) ),
		
		?do( Neg, symbol([$-]),
		?do( XS, many1( digit() ),
		return(list_to_integer(Neg ++ XS)) ))
	).

floa() ->
	choice( 
		?do(Lead, many1( digit() ),
		?do(_, symbol([$.]),
		?do(Follow, many1( digit() ),
		return( list_to_float(Lead ++ "." ++ Follow)) ))),
		
		?do( Neg, symbol([$-]),
		?do(Lead, many1( digit() ),
		?do(_, symbol([$.]),
		?do(Follow, many1( digit() ),
		return( list_to_float(Neg ++ Lead ++ "." ++ Follow)) ))))
	).

space() ->
	then( many( sat( fun isSpace/1)), fun(_) -> return({}) end).

identifier() ->
	token( ident() ).

type() ->
	token( typ() ).
	
typeVar() ->
	token( ident() ).
	
typeWithVar() ->
	token( typeW() ).

natural() ->
	token( nat() ).

float() ->
	token( floa() ).

symbol(XS) ->
	token( string(XS) ).
	
literal() ->
	token( lit() ).
	
boolean() ->
	token( bool() ).

null() ->
	token( nul() ).

%% ====================================================
%% Char -> Bool functions
%% ====================================================

isDigit(Char) when Char >= $0, Char =< $9 -> true;
isDigit(_) -> false.

isLower(Char) when Char >= $a, Char =< $z -> true;
isLower(_) -> false.

isUpper(Char) when Char >= $A, Char =< $Z -> true;
isUpper(_) -> false.

isAlpha(Char) -> isLower(Char) orelse isUpper(Char).

isEndOfString(eos) -> true;
isEndOfString(_) -> false.

isAlphaNum(Char) -> isLower(Char) orelse isUpper(Char) orelse isDigit(Char).

isAlphaNumSpace(Char) -> isAlphaNum(Char) orelse isSpace(Char).

isAlphaNumPunc(Char) -> isAlphaNum(Char) orelse Char =:= $. orelse Char =:= $~ orelse Char =:= $:.

isChar(Char) ->
	fun(TestChar) -> Char =:= TestChar end. 

isSpace(Char) -> Char =:= $ .


