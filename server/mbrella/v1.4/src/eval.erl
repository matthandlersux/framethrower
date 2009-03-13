-module (eval).
-compile( export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-include ("../include/scaffold.hrl").

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


%% 
%% evaluate:: Expr -> Expr
%% 

%This is eval when we were type checking, which allowed us to do less memoization checks
%TAG: EVALNOTYPE
% evaluate(Expr) when is_record(Expr, cons) ->
% 	case Expr#cons.type of
% 		lambda ->
% 			% ?trace(Expr),
% 			Expr;
% 		apply ->
% 			case evaluate( Expr#cons.left ) of
% 				#cons{type = lambda} = Lambda ->
% 					% ?trace(Lambda),
% 					evaluate( betaReduce(Lambda, Expr#cons.right) );
% 				Left ->
% 					% ?trace(Expr),
% 					Type = type:get( Expr ),
% 					% ?trace(Type),
% 					BottomExpr = bottomOut(Expr),	
% 					case type:isReactive(Type) of
% 						true ->
% 							NormalExpr = normalize(BottomExpr),
% 							case memoize:get( NormalExpr ) of
% 								Cell when is_record(Cell, exprCell) -> Cell;
% 								_ ->
% 									F = evaluate( Left ), 
% 									Input = evaluate( Expr#cons.right ),
% 									Result = applyFun( F, Input ),
% 									TypedCell = Result#exprCell{type = Type, bottom = BottomExpr},
% 									cell:update(TypedCell),
% 									% this is correct - memoize:add returns an onRemove function
% 									OnRemove = memoize:add( NormalExpr, TypedCell),
% 									cell:addOnRemove(TypedCell, OnRemove),
% 									TypedCell
% 							end;
% 						false ->
% 							% ?trace(Left),
% 							% ?trace(Expr#cons.right),
% 							F = evaluate( Left ), 
% 							Input = evaluate( Expr#cons.right ),
% 							case applyFun( F, Input ) of
% 								X when is_function(X) ->
% 									%decide if it needs to be named
% 									#exprFun{function = X, type = Type, bottom = BottomExpr};
% 								Result when is_record(Result, exprCell) ->
% 									TypedCell = Result#exprCell{type = Type, bottom = BottomExpr},
% 									cell:update(TypedCell),
% 									TypedCell;
% 								NumStringBool ->
% 									NumStringBool
% 							end
% 					end
% 			end
% 	end;
% evaluate(Expr) ->
% 	% here we can have any expr object...
% 	BottomExpr = bottomOut(Expr),
% 	case Expr of
% 		X when is_function(X) ->
% 			Type = type:get( Expr ),
% 			%decide if it needs to be named
% 			#exprFun{function = X, type = Type, bottom = BottomExpr};
% 		Result when is_record(Result, exprCell) ->
% 			Type = type:get( Expr ),
% 			Result#exprCell{type = Type, bottom = BottomExpr};
% 		NumStringBool ->
% 			NumStringBool
% 	end.


evaluate(Expr) when is_record(Expr, cons) ->
	case Expr#cons.type of
		lambda ->
			% ?trace(Expr),
			Expr;
		apply ->
			case evaluate( Expr#cons.left ) of
				#cons{type = lambda} = Lambda ->
					% ?trace(Lambda),
					evaluate( betaReduce(Lambda, Expr#cons.right) );
				Left ->
					BottomExpr = bottomOut(Expr),
					NormalExpr = normalize(BottomExpr),
					case memoize:get( NormalExpr ) of
						Cell when is_record(Cell, exprCell) -> Cell;
						_ ->
							F = evaluate( Left ), 
							Input = evaluate( Expr#cons.right ),
							case applyFun( F, Input ) of
								X when is_function(X) ->
									%decide if it needs to be named
									#exprFun{function = X, bottom = BottomExpr};
								Result when is_record(Result, exprCell) ->
									TypedCell = Result#exprCell{bottom = BottomExpr},
									cell:update(TypedCell),
									OnRemove = memoize:add( NormalExpr, TypedCell),
									cell:addOnRemove(TypedCell, OnRemove),
									TypedCell;
								NumStringBool ->
									NumStringBool
							end
					end
			end
	end;
evaluate(Expr) ->
	% here we can have any expr object...
	BottomExpr = bottomOut(Expr),
	case Expr of
		X when is_function(X) ->
			%decide if it needs to be named
			#exprFun{function = X, bottom = BottomExpr};
		Result when is_record(Result, exprCell) ->
			Result#exprCell{bottom = BottomExpr};
		NumStringBool ->
			NumStringBool
	end.




%% 
%% betaReduce:: LambdaCons -> ExprVar -> Expr
%% 

betaReduce( LExpr, Replacement ) when is_record(LExpr, cons) ->
	LeftLambdaVars = getLambdaVars( LExpr ),
	RightAllVars = getAllVars( Replacement ),
	#cons{left = Variable, right = Right} = lambdaVarAdjust(LeftLambdaVars, RightAllVars, LExpr),
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


lambdaVarAdjust(LeftLambdaVars, RightAllVars, Expr) ->
	% ?trace({LeftLambdaVars, RightAllVars}),
	LambdaVars = lists:usort(LeftLambdaVars),
	RightVars = lists:usort(RightAllVars),
	case LambdaVars -- RightVars of
		LambdaVars -> Expr;
		SafeVars ->
			ReplaceVars = LambdaVars -- SafeVars,
			Substitutions = findSafeSubs( ReplaceVars, getAllVars(Expr) ),
			ReplaceOverlappingLambdaVars = 
				fun( #exprVar{value = Variable} = Expr1 ) when is_record(Expr1, exprVar) ->
					case lists:keysearch(Variable, 1, Substitutions) of
						{value, {_, NewVal}} ->
							{ok, Expr1#exprVar{value = NewVal}};
						_ ->
							{ok, Expr1}
					end
				end,
			mblib:traverse(Expr, ReplaceOverlappingLambdaVars)
	end.
	
findSafeSubs([], _) -> [];
findSafeSubs([H|T], AvoidVars) ->
	[{H, dontCollide(H, AvoidVars)}|findSafeSubs(T, AvoidVars)].
	
% safeReplaceVar(Variable, Expr) ->
% 	AllVars = getAllVars(Expr),
% 	?trace(AllVars),
% 	ReplaceVar =
% 		fun( #exprVar{value = Variable1} = Expr1 ) when is_record(Expr, exprVar) ->
% 			if 
% 				Variable =:= Variable1 ->
% 					{ok, Expr1#exprVar{value = dontCollide(Variable, AllVars)}};
% 				true ->
% 					{ok, Expr1}
% 			end
% 		end,
% 	mblib:traverse(Expr, ReplaceVar).
% 
dontCollide(Variable, AllVars) -> 
	dontCollide(Variable, AllVars, "1").
	
dontCollide(Variable, AllVars, Suffix) ->
	NewVar = Variable ++ Suffix,
	case lists:member(NewVar, AllVars) of
		true ->
			dontCollide(Variable, AllVars, Suffix ++ "1");
		_ ->
			NewVar
	end.

getLambdaVars( Expr ) ->
	%TODO: catcherElements is very unfunctional, may want to change.
	Catcher = mblib:catchElements(),
	LookForLambda =
		fun( #cons{type = lambda, left = Variable, right = RightExpr} = Expr1 ) when is_record(Expr1, cons) ->
			Catcher ! {add, Variable#exprVar.value},
			{next, mblib:recordKeysToIndex(cons, [right])}
		end,
	mblib:traverse( Expr, LookForLambda ),
	Ref = make_ref(),
	Catcher ! {return, self(), Ref},
	receive {Ref, X} -> X end.

getAllVars( Expr ) ->
	Catcher = mblib:catchElements(),
	LookForVars =
		fun( #exprVar{value = Variable} = Expr1 ) when is_record(Expr1, exprVar) ->
			Catcher ! {add, Variable},
			{ok, Expr1}
		end,
	mblib:traverse( Expr, LookForVars ),
	
	Ref = make_ref(),	
	Catcher ! {return, self(), Ref},
	receive {Ref, X} -> X end.

%% 
%% take a primitave/created function and apply it to the right hand side object
%% 

applyFun( #exprFun{function = Fun} = ExprFun, Expr ) when is_record(ExprFun, exprFun) ->
	Fun(Expr).
	
bottomOut( InExpr ) -> 
	LookForAndReplaceFun = 
		fun( Expr ) when is_record(Expr, exprFun) ->
				case Expr#exprFun.bottom of
					undefined ->
						{ok, Expr};
					_ ->
						{ok, Expr#exprFun.bottom}
				end;
			( Expr ) when is_record(Expr, exprCell) ->
				case Expr#exprCell.bottom of 
					undefined ->
						{ok, Expr#exprCell.name};
					_ ->
						{ok, Expr#exprCell.bottom}
				end
		end,
	mblib:traverse(InExpr, LookForAndReplaceFun).

normalize( Expression ) -> 
	NormFun = fun( Expr ) when is_record(Expr, exprFun) ->
					{ok, Expr#exprFun{type = undefined, function = undefined, bottom = undefined}};
				( Expr ) when is_record(Expr, exprCell) ->
					{ok, Expr#exprCell{pid = undefined, type = undefined, bottom = undefined}}
		end,
	mblib:traverse(Expression, NormFun).