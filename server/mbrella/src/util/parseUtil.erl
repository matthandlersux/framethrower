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

%
% toCamel::String -> String
%
toCamel([H|T]) -> [string:to_lower(H)|T].

extractPrim([$\"|Rest]) ->
	case cutOffRightQuote(Rest) of
		{Ans, []} -> Ans;
		_ -> error
	end;
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