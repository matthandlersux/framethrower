-module (altparse).
-compile( export_all ).

-import(lists,[reverse/1, suffix/2]).

-include ("../../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

%% ====================================================
%% Parser
%% ====================================================

parse(S) ->
	{Ans, []} = parseExpr(S),
	Ans.

parseExpr([$(|Right] = S) ->
	%apply or lambda
	case Right of
		[$\\|Rest] ->
			%lambda
			{Expr, [$)|Remaining]} = parseExpr(Rest),
			{#exprLambda{
				expr = Expr
			}, Remaining};
		_ ->
			%apply
			{ApplyLeft, SpaceAndRight} = parseExpr(Right),
			[$ |Rest] = SpaceAndRight,
			{ApplyRight, [$)|Remaining]} = parseExpr(Rest),
			{#exprApply{
				left = ApplyLeft,
				right = ApplyRight
			}, Remaining}
	end;
parseExpr([$\"|Right] = S) ->
	%quoted string
	cutOffRightQuote(Right);
parseExpr([$ |Right] = S) ->
	%not sure if this will happen
	parseExpr(Right);
parseExpr([$/|Right] = S) ->
	{NumString, Rest} = untilSpaceOrRightParen(Right),
	Num = list_to_integer(NumString),
	{#exprVar{index = Num}, Rest};
parseExpr([_|Right] = S) ->
	%env variable or number
	%read until space or right paren
	{VarOrPrim, Rest} = untilSpaceOrRightParen(S),
	Ans = case extractPrim(VarOrPrim) of
		error ->
			lookupInEnv(VarOrPrim);
		Prim ->
			Prim
	end,
	{Ans, Rest}.



cutOffRightQuote([$\"|R]) ->
	{[], R};
cutOffRightQuote([L|R]) ->
	{Ans, Rest} = cutOffRightQuote(R),
	{[L|Ans], Rest}.

untilSpaceOrRightParen([]) ->
	{[], []};
untilSpaceOrRightParen([$ |R] = S) ->
	{[], S};
untilSpaceOrRightParen([$)|R] = S) ->
	{[], S};
untilSpaceOrRightParen([L|R]) ->
	{Ans, Rest} = untilSpaceOrRightParen(R),
	{[L|Ans], Rest}.

extractPrim(VarOrPrim) ->
	case VarOrPrim of
		"null" -> null;
		"true" -> true;
		"false" -> false;
		_ ->
			try list_to_integer(VarOrPrim)
			catch _:_ ->
				try list_to_float(VarOrPrim)
				catch _:_ ->
					error
				end
			end
	end.

lookupInEnv(ParsedString) ->
	case env:lookup(ParsedString) of
		notfound ->
			% #exprVar{value = ParsedString};
			throw({variable_not_in_environment, [{variable, ParsedString}]});
		ExprCell when is_record(ExprCell, exprCell) -> 
			#cellPointer{name = ParsedString, pid = ExprCell#exprCell.pid};
		Object when is_record(Object, object) -> 
			#objectPointer{name = ParsedString};
		ExprFun when is_record(ExprFun, exprFun) ->
			#funPointer{name = ParsedString};
		{exprLib, Expr} -> Expr
	end.
