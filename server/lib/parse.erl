-module (parse).
-compile( export_all ).

-define (do(X, Y, Next), then( Y, fun(X) -> Next end )).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define( test(X), X ++ "test" ).

% parse(String) ->
% 	{ok, RE} = regexp:parse( "(\\s+|\\(|\\)|->|\")"),
% 	regexpSplit(String, RE).
% 	
% 
% parse(String) ->
% 	parse([], String).
% 
% parse(Left, []) ->
% 	Left;
% parse(Left, [$-,$>,$ ,Char|T]) ->
% 	if
% 		Char =/= $  -> parse(lambda, Left, [Char] ++ T);
% 		true -> parse(Left, [$-,$>|T])
% 	end;
% parse(Left, [$(, $ |T]) ->
% 	parse(Left, [$(|T]);
% parse(Left, [$(|T]) ->
% 	parse(parenth, Left, T);
% parse(Left, [$), $ |T]) ->
% 	parse(Left, [$)|T]);
% parse(Left, [$)|T]) ->
% 	parse(apply, Left, T);
% parse(Left, [$ ,Char|T]) ->
% 	if
% 		Char =/= $  andalso Char =/= $- andalso Char =/= $> -> parse(apply, Left, [Char] ++ T);
% 		true -> parse(Left, [Char] ++ T)
% 	end;
% parse(Left, [Char1, Char2|T]) ->
% 	if
% 		Char2 =:= $  -> parse(Left ++ [Char1], T);
% 		true -> parse(Left ++ [Char1, Char2], T)
% 	end.
% 	
% parse(lambda, Left, Right) ->
% 	"{ cons, lambda, " ++ parse(Left) ++ ", " ++ parse(Right) ++ " }";
% parse(apply, Left, Right) ->
% 	"{ cons, apply, " ++ parse(Left) ++ ", " ++ parse(Right) ++ " }";
% parse(parenth, Left, Right) ->
% 	Left ++ parse(Right).

% parse(String) ->
% 	parse([], String).
% 
% parse(Left, []) -> Left;
% parse(Left, [$(|T]) ->
% 	{Inner, Outer} = parseP(trim(T)),
% 	Left ++ [{Inner}] ++ parse(trim(Outer));
% parse(Left, [Char|T]) ->
% 	parse(Left ++ [Char], T).
% 
% parseP(String) ->
% 	parseP([], String).
% 
% parseP(Left, []) -> {Left, []};
% parseP(Left, [$)|T]) ->
% 	{Left, trim(T)};
% parseP(Left, [$(|T]) ->
% 	{Inner, Outer} = parseP(trim(T)),
% 	Left ++ [{Inner}] ++ parseP(trim(Outer));
% parseP(Left, [Char|T]) ->
% 	parseP(Left ++ [Char], T).


return(Ast) ->
	fun(String) -> [{Ast, String}] end.

failure() ->
	fun(_String) -> [] end.

item() ->
	fun(String) ->
		case String of
			[] -> [];
			[H|T] -> [{H, T}]
		end
	end.

parse(Parser, String) ->
	Parser(String).

then(Parser, FunToParser) ->
	fun(String) ->
		case parse(Parser, String) of
			[] -> [];
			[{H, Tail}] -> parse( FunToParser(H), Tail )
		end
	end.

choice(Parser1, Parser2) ->
	fun(String) ->
		case parse(Parser1, String) of
			[] -> parse(Parser2, String);
			[{H, Tail}] -> [{H, Tail}]
		end
	end.

sat(Predicate) ->
	then(item(), fun(X) -> 
		case Predicate(X) of
			true -> return(X);
			false -> failure()
		end
	end
	).

many(Parser) ->
	choice( many1(Parser), return([]) ).

many1(Parser) ->
	% then(Parser, fun(V) ->
	% 		% ?trace(?test(V)),
	% 		then( many(Parser), fun(VS) -> return([V|VS]) end
	% 		)
	% 	end 
	% ).
	?do(V, Parser, 
	?do(VS, many(Parser), 
	return([V|VS]))).

token(Parser) ->
	?do( _, space(),
	?do(V, Parser,
	?do(_, space(),
	return(V)))).
	% then( space(), fun(_) ->
	% 		then( Parser, fun(V) ->
	% 				then( space(), fun(_) ->
	% 						return(V)
	% 					end)
	% 			end)
	% 	end).
		
p() ->
	then( symbol("("), fun(_) ->
			then( natural(), fun(N) ->
					then( many( then( symbol(","), fun(_) -> natural() end )), fun(NS) ->
						then( symbol(")"), fun(_) ->
								return([N|NS])
							end)
					end)
			end)
	end).



%% ====================================================
%% utilities
%% ====================================================

%% 
%% parsers
%% 

digit() ->
	sat(fun isDigit/1).

lower() ->
	sat(fun isLower/1).

upper() ->
	sat(fun isUpper/1).

letter() ->
	sat(fun isAlpha/1).

alphaNum() ->
	sat(fun isAlphaNum/1).

char(Char) ->
	sat(isChar(Char)).

string([]) ->
	return([]);
string([H|T] = String) ->
	then(char(H), fun(_) -> 
				then( string(T), fun(_) ->
					return(String)
				end
				)
		end
	).
	
ident() ->
	then(lower(), fun(X) ->
			then( many( alphaNum() ), fun(XS) ->
					return([X|XS])
				end
			)
		end
	).
	
nat() ->
	then( many1( digit() ), fun(XS) ->
				return(list_to_integer(XS))
			end
		).

space() ->
	then( many( sat( fun isSpace/1)), fun(_) -> return({}) end).

identifier() ->
	token( ident() ).

natural() ->
	token( nat() ).

symbol(XS) ->
	token( string(XS) ).
	
% lambda() ->
% 	then().


isDigit(Char) when Char >= $0, Char =< $9 -> true;
isDigit(_) -> false.

isLower(Char) when Char >= $a, Char =< $z -> true;
isLower(_) -> false.

isUpper(Char) when Char >= $A, Char =< $Z -> true;
isUpper(_) -> false.

isAlpha(Char) -> isLower(Char) orelse isUpper(Char).

isAlphaNum(Char) -> isLower(Char) orelse isUpper(Char) orelse isDigit(Char).

isChar(Char) ->
	fun(TestChar) -> Char =:= TestChar end. 

isSpace(Char) -> Char =:= $ .







regexpLoop(Str, Parts, Index, []) ->
    lists:reverse([string:substr(Str, Index)] ++ Parts);
regexpLoop(Str, Parts, Index, Rem_Matches) ->
    {NextPt,PtLen} = hd(Rem_Matches),
    regexpLoop( Str, [ string:substr(Str, NextPt, PtLen),
                        string:substr(Str, Index, NextPt - Index)]
                      ++ Parts, NextPt + PtLen,
                      tl(Rem_Matches) ).

regexpSplit(Str, Regex) ->
    {match, Matches} = regexp:matches(Str, Regex),
    regexpLoop(Str, [], 1, Matches).

trim([$ |T]) ->
	trim(T);
trim(String) ->
	String.