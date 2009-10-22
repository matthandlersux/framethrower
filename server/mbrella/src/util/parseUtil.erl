-module (parseUtil).
-compile( export_all).

cutOffRightQuote([$\"|R]) ->
	{[], R};
cutOffRightQuote([L|R]) ->
	{Ans, Rest} = cutOffRightQuote(R),
	{[L|Ans], Rest}.

untilSpaceOrRightParen([]) ->
	{[], []};
untilSpaceOrRightParen([$ |_] = S) ->
	{[], trimSpace(S)};
untilSpaceOrRightParen([$)|_] = S) ->
	{[], trimSpace(S)};
untilSpaceOrRightParen([L|R]) ->
	{Ans, Rest} = untilSpaceOrRightParen(R),
	{[L|Ans], Rest}.

trimSpace([$ |Rest]) -> trimSpace(Rest);
trimSpace(S) ->	S.


%
% toTitle::String -> String
%
toTitle([H|T]) -> [string:to_upper(H)|T].