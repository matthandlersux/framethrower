-module(testsyntax).
-compile(export_all).
-include("../include/scaffold.hrl").
-include_lib("xmerl/include/xmerl.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-record(testWorld, {startCaps=dict:new(), endCaps=dict:new(), outMessages=dict:new()}).
% 
% parseAll(D) ->
% 	% find all RSS files underneath D
% 	FL = filelib:fold_files(D, ".+.rss$", true, fun(F, L) -> [F|L] end, []),
% 	[ parse(F) || F <- FL ].


parse(FName) ->
	% parses a single RSS file
	{R,_} = xmerl_scan:file(FName),
	spawn(fun() -> 
		L = extract(R,undefined)
	end).
	%L = lists:reverse(extract(R, [])),
	% print channel title and data for first two episodes
	%io:format("~n>> ~p~n", [element(1,lists:split(3,L))]),
	%L,

% handle 'xmlElement' tags
extract(R, State) when is_record(R, xmlElement) ->
	case R#xmlElement.name of
		tests ->
			lists:foldl(fun extract/2, State, R#xmlElement.content);
		test ->
			io:format("Running test ~p~n", [getAtt(name, R)]),
			lists:foldl(fun extract/2, #testWorld{}, R#xmlElement.content);
		startcap ->
			parseStartCap(R, State);
		endcap ->
			parseEndCap(R, State);
		messages ->
			parseMessages(R, State);
		expectedmessages ->
			parseExpectedMessages(R, State);
		removeCap ->
			parseRemoveCap(R, State);
		_ -> % for any other XML elements, simply iterate over children
			lists:foldl(fun extract/2, State, R#xmlElement.content)
	end;
extract(#xmlText{}, State) -> State.  % ignore any other text data


parseStartCap(R, State) ->
	Name = getAtt(name, R),
	Type = getAtt(type, R),
	#testWorld{startCaps=StartCaps} = State,
	SCTypeFirstWord = hd(string:tokens(Type, " ")),
	SC = if
		SCTypeFirstWord == "map" -> 
			Result = cell:makeCellMapInput(), 
			Cell = Result#exprCell{type=type:parse(Type)},
			env:nameAndStoreCell(Cell);
		true -> 
			Result = cell:makeCell(),
			Cell = Result#exprCell{type=type:parse(Type)},
			env:nameAndStoreCell(Cell)
	end,
	NewStartCaps = dict:store(Name, SC, StartCaps),
	State#testWorld{startCaps=NewStartCaps}.

parseEndCap(R, State) ->
	#testWorld{startCaps=StartCaps, outMessages=OutMessages} = State,
	Name = getAtt(name, R),
	Expression = getAtt(expression, R),
	EC = eval:evaluate(expr:customExprParse(Expression, StartCaps)),

	Self = self(),
	cell:injectFunc(EC, fun(Val) -> 
		Self ! {response, Name, {set, Val}},
		fun() -> 
			case Val of
				{K,V} -> Self ! {response, Name, {remove, K}};
				_ -> Self ! {response, Name, {remove, Val}}
			end
		end
	end),
	State#testWorld{outMessages=dict:store(Name, [], OutMessages)}.
	
%private helper function
parseArgs(R) ->
	GetArg = fun(InnerR, L) ->
		case parsePrim(InnerR) of
			undefined -> L;
			Prim -> [Prim | L]
		end
	end,
	Result = lists:foldr(GetArg, [], R#xmlElement.content),
	case Result of
		[A,B|[]] -> {A,B};
		[A|[]] -> A;
		[] -> noArgs
	end.

extractMessage(R, State) when is_record(R, xmlElement) ->
	#testWorld{startCaps=StartCaps} = State,
	GetStartCap = fun() ->
		SCName = getAtt(scname, R),
		dict:fetch(SCName, StartCaps)
	end,
	Args = parseArgs(R),
	Value = case Args of 
		{scPatternMatch, Name} -> 
			dict:fetch(Name, StartCaps);
		{Key, {scPatternMatch, Name}} ->
			{Key, dict:fetch(Name, StartCaps)};
		{func, Name} ->
			env:lookup(Name);
		{Key, {func, Name}} ->
			{Key, env:lookup(Name)};			
		Arg -> Arg
	end,
	case R#xmlElement.name of
		set ->
			StartCap = GetStartCap(),
			cell:addLine(StartCap, Value);
		remove ->
			StartCap = GetStartCap(),
			cell:removeLine(StartCap, Value);
		_ -> undefined
	end;
extractMessage(_, _) -> undefined.  % ignore any other text data

	
parseMessages(R, State) ->
	lists:map(fun(InnerR) -> extractMessage(InnerR, State) end, R#xmlElement.content),
	State.
	
	
	
parseExpectedMessages(R, State) ->
	ExpectedMessages = lists:foldl(fun(InnerR, InnerExpectedMessages) -> extractExpectedMessage(InnerR, InnerExpectedMessages) end, [], R#xmlElement.content),
	loop(ExpectedMessages, [], State).

extractExpectedMessage(R, ExpectedMessages) when is_record(R, xmlElement) ->
	ECName = getAtt(ecname, R),
	MessageToCheck = {R#xmlElement.name, parseArgs(R)},
	ExpectedMessages ++ [{ECName, MessageToCheck, {false, undefined}}];
extractExpectedMessage(_, State) -> State.  % ignore any other text data

loop(ExpectedMessages, FinishedMessages, State) ->
	receive
		{response, ECName, Message} ->
			NewExpectedMessages = lists:map(fun(EMessage) -> checkIncomingMessage(EMessage, Message, State) end, ExpectedMessages),
			NewerState = lists:foldl(fun updateState/2, State, NewExpectedMessages),
			NewerExpectedMessages = lists:filter(fun filterExpectedMessages/1, NewExpectedMessages),
			NewFinishedMessages = FinishedMessages ++ lists:filter(fun filterFinishedMessages/1, NewExpectedMessages),
			if
				length(NewerExpectedMessages) == 0 -> 
					lists:map(fun outputExpectedMessage/1, NewFinishedMessages),
					NewerState;
				true -> loop(NewerExpectedMessages, NewFinishedMessages, NewerState)
			end
	after 1000 ->
		io:format("Test Timed Out~n", []),
		lists:map(fun outputExpectedMessage/1, FinishedMessages),
		lists:map(fun outputExpectedMessage/1, ExpectedMessages),
		State
	end.
	
filterExpectedMessages({_,_,{false,_}}) -> true;
filterExpectedMessages(_) -> false.
	
filterFinishedMessages({_,_,{true,_}}) -> true;
filterFinishedMessages(_) -> false.

scMatch(MessageToCheck, TrySC, StartCaps) ->
	case MessageToCheck of
		{scPatternMatch, TrySCName} -> 
			try dict:fetch(TrySCName, StartCaps) of
				TrySC -> match;
				_ -> false
			catch
				_:_ -> {scPatternMatch, TrySCName, TrySC}
			end;
		_ -> false
	end.	
	
checkIncomingMessage({ECName, MessageToCheck, {true, Output}}, IncomingMessage, State) -> {ECName, MessageToCheck, {true, Output}};
checkIncomingMessage({ECName, MessageToCheck, {false, _}}, IncomingMessage, State) ->
	#testWorld{startCaps=StartCaps} = State,
	Response =
		case IncomingMessage of
			MessageToCheck -> match;
			{Action, {Key,TrySC}} ->
				case MessageToCheck of
					{Action, {Key, MVal}} -> 
						case scMatch(MVal, TrySC, StartCaps) of
							false -> {badMatch, IncomingMessage};
							SCMatch -> SCMatch
						end;
					_ -> {badMatch, IncomingMessage}
				end;
			{Action, TrySC} ->
				case MessageToCheck of
					{Action, MVal} -> 
						case scMatch(MVal, TrySC, StartCaps) of
							false -> {badMatch, IncomingMessage};
							SCMatch -> SCMatch
						end;
					_ -> {badMatch, IncomingMessage}
				end;
			BadMatch -> {badMatch, BadMatch}
		end,
	Result = case Response of
		match -> {true, {match, "Confirmed Message: " ++ messageToString(MessageToCheck, ECName)}};
		none -> {true, {none, "Confirmed Message: " ++ messageToString(MessageToCheck, ECName)}};
		{scPatternMatch, SCName, SC} -> {true, {{scPatternMatch, SCName, SC}, "Confirmed Message: " ++ messageToString(MessageToCheck, ECName)}};
		{badMatch, WrongMessage} -> {false, "Error: Expected Message: " ++ messageToString(MessageToCheck, ECName) ++ ", but received message " ++ messageToString(WrongMessage, ECName)};
		noMessage -> {false, "Error: Expected Message: " ++ messageToString(MessageToCheck, ECName) ++ ", but received NO Message"}
	end,
	{ECName, MessageToCheck, Result}.


updateState({ECName, MessageToCheck, {true, {Control, _}}}, State) ->
	#testWorld{startCaps=StartCaps} = State,
	case Control of
		match -> State;
		none -> State;
		{scPatternMatch, SCName, SC} -> State#testWorld{startCaps=dict:store(SCName, SC, StartCaps)}	
	end;
updateState(_, State) ->
	State.
	
outputExpectedMessage({ECName, MessageToCheck, {true, Output}}) ->
	{Control, Message} = Output,
	io:format("~p~n", [Message]);
outputExpectedMessage({ECName, {none, _}, _}) ->
	io:format("No message Expected at endCap: ~p~n", [ECName]);
outputExpectedMessage({ECName, MessageToCheck, {false, Output}}) ->
	io:format("~p~n", [Output]).
	

toString(Value) ->
	case Value of
		List when is_list(List) -> List;
		Num when is_integer(Num) -> integer_to_list(Num);
		Num when is_float(Num) -> float_to_list(Num);
		Atom when is_atom(Atom) -> atom_to_list(Atom);
		{scPatternMatch, SCName} -> "StartCap-" ++ SCName;
		{func, FuncName} -> "Function-" ++ FuncName;
		_ -> "No Match for this String"
	end.

messageToString({Name, {Key, Value}}, ECName) ->
	toString(Name) ++ "(" ++ toString(Key) ++ ", " ++ toString(Value) ++ ") at endCap: " ++ ECName;
messageToString({Name, Value}, ECName) ->
	toString(Name) ++ "(" ++ toString(Value) ++ ") at endCap: " ++ ECName.

	
parseRemoveCap(R, State) ->
	State.


parsePrim(R) when is_record(R, xmlElement) ->
	case R#xmlElement.name of
		number -> list_to_integer(getAtt(value, R));
		bool -> list_to_atom(getAtt(value, R));
		func -> {func, getAtt(name, R)};
		sc -> {scPatternMatch, getAtt(name, R)};
		_ -> undefined
	end;
parsePrim(_) ->
	undefined.

fFunc(Name) -> fun(X) -> X#xmlAttribute.name == Name end.
getAtt(Name, R) -> (hd(lists:filter(fFunc(Name), R#xmlElement.attributes)))#xmlAttribute.value.


% 'main' function (invoked from shell, receives command line arguments)
main() ->
	%D = atom_to_list(hd(A)),
	%parseAll(D).
	parse("../../../shared/testing/erlangTests.xml").