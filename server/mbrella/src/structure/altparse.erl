-module (altparse).
-compile( export_all ).

-import(lists,[reverse/1, suffix/2]).

-include ("../../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

%% ====================================================
%% Parser
%% ====================================================

parse(S, Scope) ->
	{Ans, []} = parseExpr(S, Scope),
	Ans.

parseExpr([$(|Right] = S, Scope) ->
	%apply or lambda
	case Right of
		[$\\|Rest] ->
			%lambda
			{Expr, [$)|Remaining]} = parseExpr(Rest, Scope),
			{#exprLambda{
				expr = Expr
			}, Remaining};
		_ ->
			%apply
			{ApplyLeft, SpaceAndRight} = parseExpr(Right, Scope),
			[$ |Rest] = SpaceAndRight,
			{ApplyRight, [$)|Remaining]} = parseExpr(Rest, Scope),
			{#exprApply{
				left = ApplyLeft,
				right = ApplyRight
			}, Remaining}
	end;
parseExpr([$\"|Right] = S, _) ->
	%quoted string
	cutOffRightQuote(Right);
parseExpr([$ |Right] = S, Scope) ->
	%not sure if this will happen
	parseExpr(Right, Scope);
parseExpr([$/|Right] = S, _) ->
	{NumString, Rest} = untilSpaceOrRightParen(Right),
	Num = list_to_integer(NumString),
	{#exprVar{index = Num}, Rest};
parseExpr([_|Right] = S, Scope) ->
	%env variable or number
	%read until space or right paren
	{VarOrPrim, Rest} = untilSpaceOrRightParen(S),
	Ans = case extractPrim(VarOrPrim) of
		error ->
			case scope:lookup(Scope, VarOrPrim) of
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
