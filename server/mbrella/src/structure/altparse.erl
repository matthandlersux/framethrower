-module (altparse).
-compile( export_all ).

-import(lists,[reverse/1, suffix/2]).

-include ("../../mbrella/include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

%% ====================================================
%% Parser
%% ====================================================

parse(S, Env) ->
	{Ans, []} = parseExpr(S, Env),
	Ans.

parseExpr([$(|Right] = S, Env) ->
	%apply or lambda
	case Right of
		[$\\|Rest] ->
			%lambda
			{Expr, [$)|Remaining]} = parseExpr(Rest, Env),
			{#exprLambda{
				expr = Expr
			}, Remaining};
		_ ->
			%apply
			{ApplyLeft, SpaceAndRight} = parseExpr(Right, Env),
			[$ |Rest] = SpaceAndRight,
			{ApplyRight, [$)|Remaining]} = parseExpr(Rest, Env),
			{#exprApply{
				left = ApplyLeft,
				right = ApplyRight
			}, Remaining}
	end;
parseExpr([$\"|Right] = S, _) ->
	%quoted string
	cutOffRightQuote(Right);
parseExpr([$ |Right] = S, Env) ->
	%not sure if this will happen
	parseExpr(Right, Env);
parseExpr([$/|Right] = S, _) ->
	{NumString, Rest} = untilSpaceOrRightParen(Right),
	Num = list_to_integer(NumString),
	{#exprVar{index = Num}, Rest};
parseExpr([_|Right] = S, Env) ->
	%env variable or number
	%read until space or right paren
	{VarOrPrim, Rest} = untilSpaceOrRightParen(S),
	Ans = case extractPrim(VarOrPrim) of
		error ->
			case Env(VarOrPrim) of
				notfound ->
					lookupInEnv(VarOrPrim);
				Found -> Found
			end;
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
	case globalStore:lookupPointer(ParsedString) of
		notfound ->
			% #exprVar{value = ParsedString};
			throw({variable_not_in_environment, [{variable, ParsedString}]});
		Found -> Found
	end.
