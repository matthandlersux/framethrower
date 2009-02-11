-module (responseTime).
-compile(export_all).

% -include().

-define( debug, true ).

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

start() ->
	ResponseTime = spawn(fun() -> responseTimeLoop([]) end),
	register(responseTime, ResponseTime).
	
stop() ->
	responseTime ! stop,
	unregister(responseTime).
	
in(SessionId, Action, Id, Time) ->
	try responseTime ! {logIn, SessionId, Action, Id, Time}
	catch _:_ -> responseTime_off
	end.

out(SessionId, Action, Id, Time) ->
	try responseTime ! {logOut, SessionId, Action, Id, Time}
	catch _:_ -> responseTime_off
	end.

updatesOut(SessionId, Action, Updates) ->
	MsgsToLog = updatesToLogs(SessionId, Action, Updates),
	% maybe need to reverse list here
	try lists:foreach(fun(Msg) -> responseTime ! Msg end, MsgsToLog)
	catch _:_ -> responseTime_off
	end.
	
get(SessionId) ->
	try responseTime ! {get, self(), SessionId} of
		_ -> 	receive
					{dataPoints, Data} ->
						Data
				end
	catch 
		_:_ ->
			responseTime_off
	end.

%% ====================================================
%% Internal API
%% ====================================================

responseTimeLoop(History) ->
	receive
		{logIn, SessionId, Action, Id, Time} ->
			% io:format("~p~n", [{SessionId, Action, Time}]),
			responseTimeLoop( [{SessionId, in, Action, Id, Time}|History] );
		{logOut, SessionId, Action, Id, Time} ->
			% io:format("~p~n", [{SessionId, Action, Time}]),
			responseTimeLoop( [{SessionId, out, Action, Id, Time}|History] );
		{get, From, SessionId} ->
			% io:format("~p~n", [History]),
			DataPoints = lists:reverse( [ Data || {Session, _,_,_,_} = Data <- History, Session =:= list_to_binary(SessionId)] ),
			From ! {dataPoints, dataListToSVG(DataPoints) },
			% From ! {dataPoints, DataPoints},
			responseTimeLoop(History)
	end.
	
%% 
%% updatesToLogs:: Binary -> Atom -> List Struct -> {logOut, Binary, Atom, Number, Time}
%% 

updatesToLogs(_, _, []) -> [];
updatesToLogs(SessionId, Action, [Update|T]) ->
	[{logOut, SessionId, Action, struct:get_value("queryId", Update), now()}|updatesToLogs(SessionId, Action, T)].

%% ====================================================
%% Utilities
%% ====================================================

searchPage() ->
	"
	<html>
	<body>
		<form method='get' action='responseTime'>
			<input type='text' name='sessionId' />
			<input type='submit' />
		</form>
	<body>
	</html>
	".

% timestamp({_MegaSecs, _Secs, MicroSecs}=TS) ->
%     {calendar:datetime_to_gregorian_seconds( calendar:now_to_universal_time(TS) ) -
%             calendar:datetime_to_gregorian_seconds( {{1970,1,1},{0,0,0}} ), MicroSecs}.
dataListToSVG(List) ->
	List1 = lists:map(fun({A,B,C,D,{_,Sec,MSec}}) -> {A,B,C,D, Sec*1000000 + MSec} end, List),
	QuerySeq = lists:usort([ X || {_,_,_,X,_} <- List1, X =/= null ]),
	GroupedList = lists:foldl(
		fun(QueryId, Acc) -> 
			[[Y || {_,_,_,X,_} = Y <- List1, X =:= QueryId]|Acc]
		end, 
		[], QuerySeq),
	Header = "
	<text x = \"5\" y = \"15\" fill = \"black\" font-size = \"12\">
		blue squares are incoming, red are outgoing
	</text>",
	Range = lists:foldl( 
		fun(ListOfMsgs, OldRange) ->
			{TestMin, TestMax} = { lists:min([ X || {_,_,_,_,X} <- ListOfMsgs ]), lists:max([ X || {_,_,_,_,X} <- ListOfMsgs ]) },
			if
				TestMax - TestMin >= OldRange -> TestMax - TestMin;
				true -> OldRange
			end
		end,
		0, GroupedList),
	{_, OutPut} = lists:foldl( 
		fun(ListOfMsgs, {QueryOffset, AccString}) ->
			SVGString = dataListToSVG1(ListOfMsgs, QueryOffset, 
				{ lists:min([ X || {_,_,_,_,X} <- ListOfMsgs ]), Range }),
			{QueryOffset + 1, SVGString ++ AccString}
		end,
		{0, []}, GroupedList),
	svgWrap( Header ++ OutPut, 110 * length(GroupedList), 400 ).

dataListToSVG1([], _, _) -> [];
dataListToSVG1([{_, InOut, Action, _Id, Seconds}|T], XMark, {Min, Range}) ->
	XOffset = 110 * XMark,
	Blue = "blue",
	Red = "red",
	Pos1 = 10,
	Pos2 = 60,
	W = "30",
	H = "5",
	Scale = 400,
	YOffset = 50,
	if
		InOut =:= in -> Color = Blue;
		true -> Color = Red
	end,
	if
		Action =:= 'query' -> Position = Pos1;
		Action =:= pipeline -> Position = Pos2
	end,
	Y = try ((Seconds - Min) / (Range) * Scale) + YOffset
		catch _:_ -> YOffset
		end,
	Header = "<text x = \"" ++ integer_to_list(XOffset + Pos1 + 5) ++ "\" y = \"30\" fill = \"navy\" font-size = \"15\">
        query
    </text>
	<text x = \"" ++ integer_to_list(XOffset + Pos2 + 2) ++ "\" y = \"30\" fill = \"navy\" font-size = \"15\">
        pipeline
    </text>
	" ++ svgBox("black", integer_to_list(XOffset + 3), "10", "1", integer_to_list(Scale + YOffset + 30)),
	Header ++ svgBox(Color, integer_to_list(Position + XOffset), integer_to_list( erlang:round(Y) ), W, H) ++ dataListToSVG1(T, XMark, {Min, Range}).
	
svgBox(Color, X, Y, W, H) ->
	"<rect x=\"" ++ X ++ "\" y=\"" ++ Y ++ "\" width=\"" ++ W ++ "\" height=\"" ++ H ++ "\" style=\"fill:" ++ Color ++ ";stroke:black;stroke-width:1\"/>
	".

svgWrap(Text) ->
	svgWrap(Text, "100%", "100%").

svgWrap(Text, W, H) when is_integer(W) andalso is_integer(H) ->
	svgWrap(Text, integer_to_list(W), integer_to_list(H));
svgWrap(Text, W, H) ->
	"<?xml version=\"1.0\" standalone=\"no\"?>
<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" 
\"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">

<svg width=\"" ++ W ++ "\" height=\"" ++ H ++ "\" version=\"1.1\"
xmlns=\"http://www.w3.org/2000/svg\">

" ++ Text ++ "
</svg>
".
	