-module (eval).
-compile( export_all).

-include ("../include/scaffold.hrl").

evaluate(Expr) when is_record(Expr, cons) ->
	case Expr#cons.type of
		lambda ->
			Expr;
		apply ->
			case Expr#cons.left of
				#cons{type = lambda} = Lambda ->
					evaluate( betaReduce(Lambda, Expr#cons.right) );
				Left ->
					F = evaluate( Left ), 
					Input = evaluate( Expr#cons.right ),
					applyFun( F, Input )
			end
	end;
evaluate(Expr) -> Expr.

%% 
%% betaReduce:: LambdaCons -> ExprVar -> Expr
%% 

betaReduce( #cons{left = Variable, right = Right} = LExpr, Replacement ) ->
	io:format("~p~n~n", [betaReduce1( Right, Variable, Replacement)]).
	
betaReduce1( #cons{type = lambda, left = LeftVariable, right = Right} = Expr, Variable, Replace) ->
	if
		LeftVariable =:= Variable ->
			Expr;
		true ->
			Expr#cons{ right = betaReduce1(Right, Variable, Replace) }
	end;
betaReduce1( #cons{type = apply, left = Left, right = Right} = Expr, Variable, Replace ) ->
	#cons{type = apply, left = betaReduce1(Left, Variable, Replace), right = betaReduce1(Right, Variable, Replace)};
betaReduce1( Expr, Variable, Replace) when is_record(Expr, exprVar)->
	if
		Expr =:= Variable -> Replace;
		true -> Expr
	end;
betaReduce1( Expr, _, _ ) -> Expr.

%% 
%% take a primitave/created function and apply it to the right hand side object
%% 

applyFun( #exprFun{function = Fun}, Expr ) ->
	Fun(Expr).