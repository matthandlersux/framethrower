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

%% 
%% exprParse takes a string and returns and expression, an expression can then be fed into eval:evaluate
%% exprParse:: String -> Expr
%%		Expr:: exprFun | exprCell | cons | String | Number | Bool | null
%% 

exprParse(String) ->
	expr( parse(String), dict:new() ).
expr( ParsedString, LambdaEnv ) when is_record(ParsedString, cons) ->
	case ParsedString#cons.type of
		lambda ->
			ConsLeftExpr = 
			if
				is_list( ParsedString#cons.left ) -> 
					ExprVar = #exprVar{value = ParsedString#cons.left},
					LambdaEnv1 = lambdaVarStore(ExprVar#exprVar.value, ExprVar, LambdaEnv),
					ExprVar;
				true -> 
					LambdaEnv1 = LambdaEnv,
					expr( ParsedString#cons.left, LambdaEnv )
			end,
			{cons, ParsedString#cons.type, ConsLeftExpr, expr(ParsedString#cons.right, LambdaEnv1)};
		apply ->
			{cons, ParsedString#cons.type, expr(ParsedString#cons.left, LambdaEnv), expr(ParsedString#cons.right, LambdaEnv)}
	end;
expr(ParsedString, _) when ParsedString =:= "true" orelse (ParsedString =:= "false" orelse ParsedString =:= "null") ->
	list_to_atom(ParsedString);
expr(ParsedString, LambdaEnv) when is_list(ParsedString) ->
	case is_string(ParsedString) of
		true -> 
			case lambdaVarLookup(ParsedString, LambdaEnv) of
				notfound ->
					case env:lookup(ParsedString) of
						notfound ->
							#exprVar{value = ParsedString};
						Expr -> Expr
					end;
				ExprVar ->
					ExprVar
			end;
		false ->
			exit(ParsedString)
	end;
expr({primitive, _, BoolStringNat}, _) ->
	BoolStringNat;
expr({primitive, null}, _) ->
	null;	
expr(ParsedString, _) when is_number(ParsedString) ->
	ParsedString;
expr(ParsedString, _) when is_boolean(ParsedString) ->
	ParsedString;
expr(ParsedString, _) ->
	ParsedString.


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

%% 
%% old version of exprParse
%% 
% 
% 
% exprParse(String) ->
% 	expr(parse(String)).
% expr(AST) when is_record(AST, cons) ->
% 	{cons, AST#cons.type, expr(AST#cons.left), expr(AST#cons.right)};
% expr(AST) when AST =:= "true" orelse (AST =:= "false" orelse AST =:= "null") ->
% 	list_to_atom(AST);
% expr(AST) when is_list(AST) ->
% 	case is_string(AST) of
% 		true -> 
% 			case env:lookup(AST) of
% 				notfound ->
% 					#exprVar{value = AST};
% 				Expr -> Expr
% 			end;
% 		false ->
% 			exit(AST)
% 	end;
% expr({primitive, _, BoolStringNat}) ->
% 	BoolStringNat;
% expr({primitive, null}) ->
% 	null;	
% expr(AST) when is_number(AST) ->
% 	AST;
% expr(AST) when is_boolean(AST) ->
% 	AST;
% expr(AST) ->
% 	AST.
	
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

