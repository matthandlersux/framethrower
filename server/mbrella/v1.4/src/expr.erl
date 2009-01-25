-module (expr).
-compile(export_all).

-import (parse, [choice/2, choice/1, literal/0, identifier/0, failure/0,
 				boolean/0, null/0, natural/0, symbol/1, return/1, then/2, nest/3, alphaNum/0]).
-include ("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

% do notation
-define (do(X, Y, Next), then( Y, fun(X) -> Next end )).

%exprCustom checks for cells in a passed in dict
customExprParse(String, Dict) ->
	customExpr(parse(String), Dict).
customExpr(AST, Dict) when is_record(AST, cons) ->
	{cons, AST#cons.type, customExpr(AST#cons.left, Dict), customExpr(AST#cons.right, Dict)};
customExpr(AST, _) when AST =:= "true" orelse AST =:= "false" ->
	list_to_atom(AST);
customExpr(AST, Dict) when is_list(AST) ->
	case is_string(AST) of
		true ->
			try dict:fetch(AST, Dict)
			catch
				_:_ -> 
					case env:lookup(AST) of
						notfound ->
							#exprVar{value = AST};
						Expr -> Expr
					end
			end;
		false ->
			exit(AST)
	end;
customExpr({primitive, _, BoolStringNat}, _) ->
	BoolStringNat;
customExpr(AST, _) when is_number(AST) ->
	AST;
customExpr(AST, _) when is_boolean(AST) ->
	AST;
customExpr(AST, _) ->
	AST.



exprParse(String) ->
	expr(parse(String)).
expr(AST) when is_record(AST, cons) ->
	{cons, AST#cons.type, expr(AST#cons.left), expr(AST#cons.right)};
expr(AST) when AST =:= "true" orelse (AST =:= "false" orelse AST =:= "null") ->
	list_to_atom(AST);
expr(AST) when is_list(AST) ->
	case is_string(AST) of
		true -> 
			case env:lookup(AST) of
				notfound ->
					#exprVar{value = AST};
				Expr -> Expr
			end;
		false ->
			exit(AST)
	end;
expr({primitive, _, BoolStringNat}) ->
	BoolStringNat;
expr({primitive, null}) ->
	null;	
expr(AST) when is_number(AST) ->
	AST;
expr(AST) when is_boolean(AST) ->
	AST;
expr(AST) ->
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
				Ident =:= "true"; Ident =:= "false"; Ident =:= "null" -> failure();
				true -> return(Ident)
			end),
		
		?do(Null, null(), return({primitive, null})),
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

