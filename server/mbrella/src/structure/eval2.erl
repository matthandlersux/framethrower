-module (eval2).
-compile( export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define(consKeysRight, [4] ).

-include ("../../include/scaffold.hrl").

%% 
%% Expr consists of:
% 
% cons
% exprVar
% exprFun
% exprCell
% string
% bool
% number
%% 

evaluate(AST) ->
	Type = ast:type(AST),
	evaluate(Type, AST).
	
evaluate(apply, AST) ->
	LHS = ast:lhs(AST),
	RHS = ast:rhs(AST),
	EvalLHS = evaluate(LHS),
	case ast:type( EvalLHS ) of
		lambda ->
			evaluate( betaReduce( EvalLHS, RHS ) );
		_ ->
			BottomExpr = bottomOut( AST ),
			case mewpile:get( BottomExpr ) of
				false ->
					F = evaluate( EvalLHS ),
					Parameters = evaluate( RHS ),
					ResultOfApply = applyFun( F, Parameters ),
					case ast:type(ResultOfApply) of
						function ->
							ast:createFunction( ResultOfApply );
						cellPointer ->
							;
				CellPointer ->
					CellPointer
			end
	end
			
	;
evaluate(_LambdaObjectNumStringBool, AST) ->
	AST.
			

% Evaluate with older memoization strategy
evaluate(Expr) when is_record(Expr, exprApply) orelse is_record(Expr, exprLambda) ->
	case Expr of
		Lambda when is_record(Lambda, exprLambda) ->
			Lambda;
		Apply when is_record(Apply, exprApply) ->
			case evaluate( Apply#exprApply.left ) of
				Lambda when is_record(Lambda, exprLambda) ->
					evaluate( betaReduce(Lambda#exprLambda.expr, Apply#exprApply.right) );
				Left ->
					BottomExpr = bottomOut(Apply),
					case memoize:get( BottomExpr ) of
						Cell when is_record(Cell, cellPointer) -> Cell;
						_ ->
							F = evaluate( Left ), 
							Input = evaluate( Apply#exprApply.right ),
							case applyFun( F, Input ) of
								X when is_function(X) ->
									%decide if it needs to be named
									#exprFun{function = X, bottom = BottomExpr};
								Result when is_record(Result, cellPointer) ->
									Cell = globalStore:lookup(Result#cellPointer.name),
									CellWithBottom = Cell#exprCell{bottom = BottomExpr},
									globalStore:store(Result#cellPointer.name, CellWithBottom),
									OnRemove = memoize:add( BottomExpr, Result),
									cell:addOnRemove(Result, OnRemove),
									Result;
								NumStringBool ->
									NumStringBool
							end
					end
			end
	end;
evaluate(Object) when is_record(Object, object) -> 
	#objectPointer{name = Object#object.name};
evaluate(NumStringBool) -> NumStringBool.	

%% 
%% betaReduce:: ExprLambda -> Expr -> Expr
%%		betaReduce takes the ExprLambda#exprLambda.expr and an aritrary expression and returns 
%%		ExprLambda#exprLambda.expr such that every occurence 
%%		of that ExprLambdas variable is replaced by Expr
%%		
%%		this function in De Bruijn aware, though it does not know how to pronounce "De Bruijn" 
%% 

betaReduce( Expr, ReplaceExpr) ->
	betaReduce( Expr, 1, ReplaceExpr).
	
betaReduce( Expr, BinderLevel, ReplaceExpr ) ->
	case Expr of
		#exprVar{index = BinderLevel} ->
			ReplaceExpr;
		Lambda when is_record(Lambda, exprLambda) ->
			#exprLambda{
				expr = betaReduce( Lambda#exprLambda.expr, BinderLevel + 1, ReplaceExpr)
			};
		Apply when is_record(Apply, exprApply) ->
			#exprApply{
				left = betaReduce( Apply#exprApply.left, BinderLevel, ReplaceExpr),
				right = betaReduce( Apply#exprApply.right, BinderLevel, ReplaceExpr)
			};
		_ -> Expr
	end.

%% 
%% take a primitave/created function and apply it to the right hand side object
%% 

applyFun( #exprFun{function = Fun} = ExprFun, Expr ) when is_record(ExprFun, exprFun) ->
	Fun(Expr);
applyFun( #funPointer{name = Name} = FunPointer, Expr ) when is_record(FunPointer, funPointer) ->
	#exprFun{function = Fun} = globalStore:lookup(Name),
	Fun(Expr).
	
bottomOut( InExpr ) -> 
	case InExpr of
		ExprFun when is_record(ExprFun, exprFun) ->
			case ExprFun#exprFun.bottom of
				undefined ->
					#exprFun{name=ExprFun#exprFun.name};
				_ ->
					ExprFun#exprFun.bottom
			end;
		ExprPointer when is_record(ExprPointer, cellPointer) ->
			Expr = globalStore:lookup(ExprPointer#cellPointer.name),
			case Expr#exprCell.bottom of 
				undefined ->
					Expr#exprCell.name;
				_ ->
					Expr#exprCell.bottom
			end;
		ExprApply when is_record(ExprApply, exprApply) ->
			ExprApply#exprApply{
				left = bottomOut(ExprApply#exprApply.left),
				right = bottomOut(ExprApply#exprApply.right)
			};
		ExprLambda when is_record(ExprLambda, exprLambda) ->
			ExprLambda#exprLambda{
				expr = bottomOut(ExprLambda#exprLambda.expr)
			};
		_ -> InExpr
	end.

% normalize( Expression ) -> 
% 	NormFun = fun( Expr ) when is_record(Expr, exprFun) ->
% 		{ok, Expr#exprFun{type = undefined, function = undefined, bottom = undefined}}
% 	end,
% 	mblib:traverse(Expression, NormFun).