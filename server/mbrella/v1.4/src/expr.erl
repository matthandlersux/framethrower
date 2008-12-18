-module (expr).
-compile(export_all).

-import (parse, [choice/2, choice/1, literal/0, identifier/0, failure/0,
 				boolean/0, natural/0, symbol/1, return/1, then/2, nest/3]).
-include ("../include/scaffold.hrl").

% do notation
-define (do(X, Y, Next), then( Y, fun(X) -> Next end )).

expr(String) ->
	DefaultEnv = getEnv(default),
	expr( parse(String), DefaultEnv).

expr(AST, Env) when is_record(AST, cons) ->
	{cons, AST#cons.type, expr(AST#cons.left, Env), expr(AST#cons.right, Env)};
expr(AST, _) when AST =:= "true" orelse AST =:= "false" ->
	list_to_atom(AST);
expr(AST, Env) when is_list(AST) ->
	case is_string(AST) of
		true -> 
			case getFun(AST, Env) of
				{ok, {Type, Fun}} ->
					{exprFun, "fun", Type, AST, Fun};
				_ ->
					{exprVar, "var", AST}
			end;
		false ->
			exit(AST)
	end;
expr(AST, _) when is_number(AST) ->
	AST;
expr(AST, _) when is_boolean(AST) ->
	AST;
expr(AST, _) ->
	AST.
	
%% ====================================================
%% parser
%% ====================================================

parse(String) ->
	case parse:parse(lambda(), String ++ [eos]) of
		[{Result, []}] -> Result;
		[{Result, [eos]}] -> Result;
		[{Result, Leftovers}] -> io:format("unused input \"~p\"~n~nresult: ~p~n", [Leftovers -- [eos], Result]);
		% [{X,Y}] -> io:format("~120p~n~n~120p~n~n", [X, Y -- [eos]]);
		[] -> io:format("invalid input ~n", [])
	end.

%% ====================================================
%% our context free grammar to parse
%% ====================================================


lambda() ->
	?do(T, apply(),
		choice(
			?do( _, symbol("->"),
			?do( E, lambda(),
			return({cons, lambda, T, E}))), %or
			return(T)
		)
	).

apply() ->
	choice(
		?do(LeftMost, apply1(),
		choice(
			nest( LeftMost, element(), fun(X, Acc) -> {cons, apply, Acc, X} end), %or
			return(LeftMost)
		)), %or
		element()
	).
	
apply1() ->
	?do(Left, element(),
	?do(Right, element(),
	return({cons, apply, Left, Right}))).

element() ->
	choice(
		?do(_, symbol("("),
		?do(E, lambda(),
		?do(_, symbol(")"),
		return(E)))), %or
		primitive()
	).
	
primitive() ->
	choice([
		?do(Lit, literal(),
		return({primitive, string, Lit})),
		
		?do(Ident, identifier(),
			if
				Ident =:= "true"; Ident =:= "false" -> failure();
				true -> return(Ident)
			end),
		
		?do(Bool, boolean(), return({primitive, bool, list_to_atom(Bool)})),
		
		?do(Nat, natural(),
		return({primitive, nat, list_to_integer(Nat)}))
		% ?do(Cell, cell(), return...)
	]).



%% ====================================================
%% environment functions
%% ====================================================

getFun(Key, Env) ->
	try dict:fetch(Key, Env) of
		{Type, Fun} -> {ok, {Type, Fun}}
	catch
		_:_ -> false
	end.
		
getEnv(default) ->
	BuildEnv = fun({Name, TypeString, Fun}, {Suffix, Dict}) ->
					{Suffix + 1, dict:store(Name, {type:shiftVars( type:parse(TypeString), integer_to_list(Suffix) ++ "v"), Fun}, Dict)}
				end,
	FunList = [
		% {"bindUnit", "type" , fun component:bindUnit/1},
		{"bindSet", "(a -> Set b) -> Set a -> Set b", fun component:bindSet/1},
		% {"compose", "f -> g -> x -> f (g x)", fun component:compose/1},
		% {"compose", "(b -> c) -> (a -> b) -> (a -> c)", fun component:compose/1},
		{"compose", "(a -> b) -> (c -> a) -> (c -> b)", fun component:compose/1},
		{"returnUnitSet", "Unit a -> Set a", fun component:returnUnitSet/1},
		{"passthru", "(a -> Bool) -> a -> Unit a", fun component:passthru/1},
		{"not", "Bool -> Bool", fun component:passthru/1}
		

	],
	{_, FinalDict} = lists:foldl( BuildEnv, {1, dict:new()}, FunList),
	FinalDict.
	

	
%% ====================================================
%% utilities
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