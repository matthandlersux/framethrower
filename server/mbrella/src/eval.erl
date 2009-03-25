-module (eval).
-compile( export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define(consKeysRight, [4] ).

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

% Evaluate with older memoization strategy
evaluate(Expr) when is_record(Expr, cons) ->
	case Expr#cons.type of
		lambda ->
			% ?trace(Expr),
			Expr;
		apply ->
			case evaluate( Expr#cons.left ) of
				#cons{type = lambda} = Lambda ->
					% ?trace(Lambda),
					Fun = normalizeVariables(Lambda, "x"),
					Input = normalizeVariables(Expr#cons.right, "y"),
					evaluate( betaReplace(Fun#cons.right, (Fun#cons.left)#exprVar.value, Input) );
				Left ->
					Normal = normalizeVariables(Expr, "x"),
					BottomExpr = bottomOut(Normal),
					% ?trace(BottomExpr),
					% NormalExpr = normalize(BottomExpr),
					case memoize:get( BottomExpr ) of
						Cell when is_record(Cell, cellPointer) -> Cell;
						_ ->
							F = evaluate( Left ), 
							Input = evaluate( Expr#cons.right ),
							case applyFun( F, Input ) of
								X when is_function(X) ->
									%decide if it needs to be named
									#exprFun{function = X, bottom = BottomExpr};
								Result when is_record(Result, cellPointer) ->
									Cell = env:lookup(Result#cellPointer.name),
									TypedCell = Cell#exprCell{bottom = BottomExpr},
									cell:update(TypedCell),
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

% evaluate(Expr) ->
% 	{Result, _} = evaluateH(Expr),
% 	Result.
% 
% evaluateH(Expr) when is_record(Expr, cons) ->
% 	case Expr#cons.type of
% 		lambda ->
% 			% ?trace(Expr),
% 			{Expr, Expr};
% 		apply ->
% 			{EvalLeft, LeftBottom} = evaluateH( Expr#cons.left ),
% 			case EvalLeft of
% 				#cons{type = lambda} = Lambda ->
% 					% ?trace(Lambda),
% 					{BetaR, BetaRBottom} = evaluateH( betaReduce(Lambda, Expr#cons.right) ),
% 					{BetaR, #cons{type = apply, left = LeftBottom, right = BetaRBottom}};
% 				Left ->
% 					{F, FBottom} = {Left, LeftBottom},
% 					{Input, InputBottom} = evaluateH( Expr#cons.right ),
% 					
% 					BottomExpr = Expr#cons{type = apply, left = FBottom, right = InputBottom},
% 					% NormalExpr = normalize(BottomExpr),
% 					case memoize:get( BottomExpr ) of
% 						Cell when is_record(Cell, cellPointer) -> {Cell, Cell};
% 						_ ->
% 							case applyFun( F, Input ) of
% 								X when is_function(X) ->
% 									%decide if it needs to be named
% 									{#exprFun{function = X}, BottomExpr};
% 								Result when is_record(Result, cellPointer) ->
% 									OnRemove = memoize:add( BottomExpr, Result),
% 									cell:addOnRemove(Result, OnRemove),
% 									{Result, Result};
% 								NumStringBool ->
% 									{NumStringBool, BottomExpr}
% 							end
% 					end
% 			end
% 	end;
% evaluateH(Object) when is_record(Object, object) -> 
% 	Result = #objectPointer{name = Object#object.name},
% 	{Result, Result};
% evaluateH(NumStringBool) -> 
% 	{NumStringBool, NumStringBool}.




% Takes in a closed Expr and returns it back but with every lambda's parameter renamed in a standard way
% 	Properties:
% 		Every lambda expression will have a unique parameter name
% 		normalizeVariables will return the same thing on any Expr's that are "alpha-equivalent" (equivalent up to variable names)
% 	Optional parameter prefix: will name variables starting with this prefix, default is "x"
normalizeVariables(Expr, Prefix) ->
	normalizeHelper(Expr, [], Prefix, 0).

normalizeHelper(Expr, Vars, Prefix, VarCount) ->
	case Expr of
		Cons when is_record(Expr, cons) ->
			case Expr#cons.type of
				apply ->
					#cons{
						type = apply,
						left = normalizeHelper(Expr#cons.left, Vars, Prefix, VarCount),
						right = normalizeHelper(Expr#cons.right, Vars, Prefix, VarCount)
					};
				lambda ->
					NewVar = Prefix ++ integer_to_list(VarCount),
					NewVars = [{(Expr#cons.left)#exprVar.value, NewVar}|Vars],
					#cons{
						type = lambda,
						left = #exprVar{value = NewVar},
						right = normalizeHelper(Expr#cons.right, NewVars, Prefix, VarCount+1)
					}
			end;
		Var when is_record(Var, exprVar) ->
			{_, {_, VarName}} = lists:keysearch(Var#exprVar.value, 1, Vars),
			Var#exprVar{value = VarName};
		_ ->
			Expr
	end.
			

betaReplace(Expr, Name, ReplaceExpr) ->
	% replaces all Var's with (.value == name) with replaceExpr in expr
	% this should only be called if expr and replaceExpr share no variable names (to avoid collisions)
	case Expr of
		#exprVar{value = Name} ->
			ReplaceExpr;
		Cons when is_record(Cons, cons) ->
			Cons#cons{
				left = betaReplace(Cons#cons.left, Name, ReplaceExpr),
				right = betaReplace(Cons#cons.right, Name, ReplaceExpr)
			};
		_ ->
			Expr
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
			% recordKeysToIndex can be turned into a macro to save time
			{next, ?consKeysRight}
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
	Fun(Expr);
applyFun( #funPointer{name = Name} = FunPointer, Expr ) when is_record(FunPointer, funPointer) ->
	#exprFun{function = Fun} = env:lookup(Name),
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
			Expr = env:lookup(ExprPointer#cellPointer.name),
			case Expr#exprCell.bottom of 
				undefined ->
					Expr#exprCell.name;
				_ ->
					Expr#exprCell.bottom
			end;
		Cons when is_record(Cons, cons) ->
			Cons#cons{
				left = bottomOut(Cons#cons.left),
				right = bottomOut(Cons#cons.right)
			};
		_ -> InExpr
	end.

% normalize( Expression ) -> 
% 	NormFun = fun( Expr ) when is_record(Expr, exprFun) ->
% 		{ok, Expr#exprFun{type = undefined, function = undefined, bottom = undefined}}
% 	end,
% 	mblib:traverse(Expression, NormFun).