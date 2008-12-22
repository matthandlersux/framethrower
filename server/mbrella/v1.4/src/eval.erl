-module (eval).
-compile( export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-include ("../include/scaffold.hrl").

evaluate(Expr) when is_record(Expr, cons) ->
	case Expr#cons.type of
		lambda ->
			?trace(Expr),
			Expr;
		apply ->
			case Expr#cons.left of
				#cons{type = lambda} = Lambda ->
					?trace(Lambda),
					evaluate( betaReduce(Lambda, Expr#cons.right) );
				Left ->
					% io:format("~p~n~n", [Expr]),
					Type = type:get( Expr ),
					BottomExpr = bottomOut(Expr),	
					case type:isReactive(Type) of
						true ->
							case memoize:get( BottomExpr ) of
								Cell when is_record(Cell, exprCell) ->
									Cell;
								_ ->
									F = evaluate( Left ), 
									Input = evaluate( Expr#cons.right ),
									Pid = applyFun( F, Input ),
									Cell = #exprCell{pid = Pid, type = Type, expr = BottomExpr},
									OnRemove = memoize:add( BottomExpr, Cell),
									cell:addOnRemove(Pid, OnRemove),
									Cell
							end;
						false ->
							?trace(Left),
							?trace(Expr#cons.right),
							F = evaluate( Left ), 
							Input = evaluate( Expr#cons.right ),
							case applyFun( F, Input ) of
								X when is_function(X) ->
									%decide if it needs to be named
									#exprFun{function = X, type = Type, expr = BottomExpr};
								Pid when is_pid(Pid) ->
									#exprCell{pid = Pid, type = Type, expr = BottomExpr};									
								NumStringBool ->
									NumStringBool
							end
					end
			end
	end;
evaluate(Expr) -> Expr.

%% 
%% betaReduce:: LambdaCons -> ExprVar -> Expr
%% 

betaReduce( #cons{left = Variable, right = Right} = LExpr, Replacement ) when is_record(LExpr, cons) ->
	betaReduce1( Right, Variable, Replacement).
	
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

applyFun( #exprFun{function = Fun} = ExprFun, Expr ) when is_record(ExprFun, exprFun) ->
	case Expr of
		#exprCell{pid=Pid} -> Fun(Pid);
		_ -> Fun(Expr)
	end.
	
bottomOut( InExpr ) -> 
	LookForAndReplaceFun = 
		fun( Expr ) when is_record(Expr, exprFun) ->
				case Expr#exprFun.name of
					undefined ->
						{ok, Expr#exprFun.expr};
					_ ->
						{ok, Expr}
				end;
			( Expr ) when is_record(Expr, exprCell) ->
				case Expr#exprCell.name of 
					undefined ->
						{ok, Expr#exprCell.expr};
					_ ->
						{ok, Expr}
				end
		end,
	mblib:traverse(InExpr, LookForAndReplaceFun).

normalize( Expr ) -> Expr.