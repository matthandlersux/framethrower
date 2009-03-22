-module (altparse).
-compile( export_all ).

-import(lists,[reverse/1, suffix/2]).

-include ("../mbrella/v1.4/include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

%% ====================================================
%% Parser
%% ====================================================


parse(S) ->
	Seps = [" ", "(",")","->", "\""],
	
	Tokens = tokens(S, Seps),
	
	WithPulledStrings = pullQuotedStrings(Tokens),
	
	WithPrimitives = findPrimitives(WithPulledStrings),
	
	WithNestedParens = case nestParens(WithPrimitives) of
		{Answer, []} ->
			Answer;
		_ ->
			throw({unbalancedParens, "Unbalanced Parens"})
	end,
	
	WithLamdas = parseLambdas(WithNestedParens),
	
	parseApplys(WithLamdas)
	
	.
	
	
	% parseApplys(S, Tokens).
	
checkBackSpace({token, Token}) ->
	suffix("\\", Token);
checkBackSpace(_) ->
	false.


pullQuotedStrings(Tokens) ->
	pullQuotedStrings(Tokens, false, [], false).

pullQuotedStrings([Token|Tokens], Quoting, Qs, PrevBS) ->
	case Quoting of
		false ->
			case Token of
				"\"" ->
					pullQuotedStrings(Tokens, true, "\"", false);
				_ ->
					BS = checkBackSpace(Token),
					[Token | pullQuotedStrings(Tokens, false, Qs, BS)]
			end;
		true ->
			case {Token, PrevBS} of
				{"\"", false} ->
					NewQs = lists:flatten([Token|Qs]),
					[NewQs | pullQuotedStrings(Tokens, false, NewQs, false)];
				_ ->
					BS = checkBackSpace(Token),
					pullQuotedStrings(Tokens, true, [Token|Qs], BS)
			end
	end;
pullQuotedStrings([], _, _, _) ->
	[].


nestParens([Token|Tokens]) ->
	case Token of
		" " ->
			nestParens(Tokens);
		"(" ->
			{Inner, Rest} = nestParens(Tokens),
			{Answer, Rest2} = nestParens(Rest),
			{[Inner | Answer], Rest2};
		")" ->
			{[], Tokens};
		_ ->
			{Answer, Rest} = nestParens(Tokens),
			{[Token | Answer], Rest}
	end;
nestParens([]) ->
	{[], []}.


notArrow("->") -> false;
notArrow(_) -> true.

parseLambdas({token, String} = Token) ->
	Token;
parseLambdas(Tokens) when is_list(Tokens) ->
	{Left, ArrowAndRight} = lists:splitwith(fun notArrow/1, Tokens),
	case ArrowAndRight of
		[] -> 
			lists:map(fun parseLambdas/1, Tokens);
		[_|Right] ->
			#cons{
				type = lambda,
				left = lists:map(fun parseLambdas/1, Left),
				right = parseLambdas(Right)
			}
	end;
parseLambdas(Char) ->
	Char.

parseApplys({token, Token}) ->
	Token;
parseApplys(Cons) when is_record(Cons, cons) ->
	Cons#cons{
		left = parseApplys(Cons#cons.left),
		right = parseApplys(Cons#cons.right)
	};
parseApplys(Tokens) when is_list(Tokens) ->
	case Tokens of
		[First|[]] -> parseApplys(First);
		_ ->
			{Left, Right} = lists:split(length(Tokens) - 1, Tokens),
			#cons{
				type = apply,
				left = parseApplys(Left),
				right = parseApplys(Right)
			}
	end;
parseApplys(Char) ->
	Char.


%Util

prefix([X|PreTail], [X|Tail]) ->
    prefix(PreTail, Tail);
prefix([], List) -> {true, List};
prefix([_|_], List) -> false.


match(In, [Sep|Seps]) ->
	case prefix(Sep, In) of
		{true, Rest} ->
			{Sep, Rest};
		_ -> match(In, Seps)
	end;
match(In, []) ->
	In.
	
findPrimitives([TokenOrSep|Tokens]) ->
	case TokenOrSep of
		{token, Token} ->
			NewToken = case Token of
				"null" -> null;
				"true" -> true;
				"false" -> false;
				_ ->
					try list_to_integer(Token)
					catch _:_ ->
						try list_to_float(Token)
						catch _:_ ->
							Token
						end
					end
			end,
			[{token, NewToken} | findPrimitives(Tokens)];
		_ -> 
			[TokenOrSep | findPrimitives(Tokens)]
	end;
findPrimitives([]) -> [].


tokens(S, Seps) ->
	tokens1(S, Seps, []).
	
tokens1([], _Seps, Toks) ->
	reverse(Toks);
tokens1(In, Seps, Toks) ->
	case match(In, Seps) of
		{Tok, Rest} ->
			tokens1(Rest, Seps, [Tok|Toks]);
		[C|S] ->
			tokens2(S, Seps, Toks, [C])
	end.
	
tokens2([], _Seps, Toks, Cs) ->
	reverse([{token, reverse(Cs)}|Toks]);
tokens2(In, Seps, Toks, Cs) ->
	case match(In, Seps) of
		{Tok, Rest} ->
			tokens1(Rest, Seps, [Tok|[{token, reverse(Cs)}|Toks]]);
		[C|S] ->
			tokens2(S, Seps, Toks, [C|Cs])
	end.