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
			io:format("Going to run getFun on ~p~n", [AST]),
			case getFromEnv(AST, Env) of
				ExprFun when is_record(ExprFun, exprFun) -> ExprFun#exprFun{name=AST};
				ExprCell when is_record(ExprCell, exprCell) -> ExprCell;
				_ ->
					#exprVar{value = AST}
					% {exprVar, "var", AST}
			end;
		false ->
			exit(AST)
	end;
expr({primitive, _, BoolStringNat}, _) ->
	BoolStringNat;
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
		return({primitive, nat, Nat})),
		
		?do(_, symbol("<"),
		?do(X, natural(),
		?do(_, symbol("."),
		?do(Y, natural(),
		?do(_, symbol("."),
		?do(Z, natural(),
		?do(_, symbol(">"),
		return(list_to_pid("<"++integer_to_list(X)++"."++integer_to_list(Y)++"."++integer_to_list(Z)++">")))))))))
		% ?do(Cell, cell(), return...)
	]).



%% ====================================================
%% environment functions
%% ====================================================

getFromEnv(Key, Env) ->
	try dict:fetch(Key, Env)
	catch
		_:_ -> false
	end.
		
getEnv(default) ->
	primFuncs:getPrimitives().

	
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
	
normalize( Expr ) -> nyi.

