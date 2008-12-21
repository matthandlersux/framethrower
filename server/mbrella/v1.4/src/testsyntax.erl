-module(testsyntax).
-compile(export_all).
-include("../include/scaffold.hrl").
-include_lib("xmerl/include/xmerl.hrl").

-record(testWorld, {env=expr:getEnv(default), endCaps=dict:new(), outMessages=dict:new()}).
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
	#testWorld{env=Env} = State,
	SCTypeFirstWord = hd(string:tokens(Type, " ")),
	SC = if 
		SCTypeFirstWord == "assoc" -> #exprCell{pid=cell:makeCellAssocInput(), type=type:parse(Type)};
		true -> #exprCell{pid=cell:makeCell(), type=type:parse(Type)}
	end,
	NewEnv = dict:store(Name, SC, Env),
	State#testWorld{env=NewEnv}.


parseEndCap(R, State) ->
	#testWorld{env=Env, outMessages=OutMessages} = State,
	Name = getAtt(name, R),
	Expression = getAtt(expression, R),
	#exprCell{pid=EC} = eval:evaluate(expr:expr(expr:parse(Expression), Env)),
	Self = self(),
	cell:injectFunc(EC, fun(Val) -> 
		Self ! {response, Name, {set, Val}},
		fun() -> 
			Self ! {response, Name, {remove, Val}} 
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
	#testWorld{env=Env} = State,
	GetStartCap = fun() ->
		SCName = getAtt(scname, R),
		#exprCell{pid=Pid} = dict:fetch(SCName, Env),
		Pid
	end,
	Value = parseArgs(R),
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
	#testWorld{outMessages=OutMessages} = State,
	receive
		{response, ECName, Message} ->
			ECMessages = dict:fetch(ECName, OutMessages),
			NewOutMessages = dict:store(ECName, ECMessages ++ [Message], OutMessages),
			NewState = State#testWorld{outMessages=NewOutMessages},
			NewExpectedMessages = lists:map(fun(EMessage) -> checkIncomingMessage(EMessage, NewState) end, ExpectedMessages),
			NewerState = lists:foldl(fun updateOutMessages/2, NewState, NewExpectedMessages),
			NewerExpectedMessages = lists:filter(fun filterExpectedMessages/1, NewExpectedMessages),
			NewFinishedMessages = FinishedMessages ++ lists:filter(fun filterFinishedMessages/1, NewExpectedMessages),
			if
				length(NewerExpectedMessages) == 0 -> 
					lists:map(fun outputExpectedMessage/1, NewFinishedMessages),
					NewerState;
				true -> loop(NewerExpectedMessages, NewFinishedMessages, NewerState)
			end
	after 1000 ->
		io:format("Error: Test Timed Out~n", []),
		lists:map(fun outputExpectedMessage/1, FinishedMessages),
		lists:map(fun outputExpectedMessage/1, ExpectedMessages),
		State
	end.
	
filterExpectedMessages({_,_,{false,_}}) -> true;
filterExpectedMessages(_) -> false.
	
filterFinishedMessages({_,_,{true,_}}) -> true;
filterFinishedMessages(_) -> false.
	
checkIncomingMessage({ECName, MessageToCheck, {true, Output}}, State) -> {ECName, MessageToCheck, {true, Output}};
checkIncomingMessage({ECName, MessageToCheck, {false, _}}, State) ->
	#testWorld{env=Env, outMessages=OutMessages} = State,
	Response =
		try hd(dict:fetch(ECName, OutMessages)) of
			{set, {startCap, TrySCName}} -> 
				try dict:fetch(TrySCName, Env) of
					TrySC -> case MessageToCheck of
						{set, TrySC} -> match;
						OtherMessage -> {badMatch, OtherMessage}
					end
				catch
					Type:Exception -> case MessageToCheck of
						{set, TrySC} -> {scPatternMatch, TrySCName, TrySC};
						OtherMessage -> {badMatch, OtherMessage}
					end
				end;
			MessageToCheck -> match;
			BadMatch -> {badMatch, BadMatch}
		catch
			Type:Exception -> 
				case MessageToCheck of
					{none,_} -> none;
					_ -> noMessage
				end
		end,
	Result = case Response of
		match -> {true, {match, "Confirmed Message: " ++ messageToString(MessageToCheck, ECName)}};
		none -> {true, {none, "Confirmed Message: " ++ messageToString(MessageToCheck, ECName)}};
		{scPatternMatch, SCName, SC} -> {true, {{scPatternMatch, SCName, SC}, "Confirmed Message: " ++ messageToString(MessageToCheck, ECName)}};
		{badMatch, WrongMessage} -> {false, "Error: Expected Message: " ++ messageToString(MessageToCheck, ECName) ++ ", but received message " ++ messageToString(WrongMessage, ECName)};
		noMessage -> {false, "Error: Expected Message: " ++ messageToString(MessageToCheck, ECName) ++ ", but received NO Message"}
	end,
	{ECName, MessageToCheck, Result}.


updateOutMessages({ECName, MessageToCheck, {true, Output}}, State) ->
	#testWorld{env=Env, outMessages=OutMessages} = State,
	{Control, Message} = Output,

	ECMessages = dict:fetch(ECName, OutMessages),
	case {Control, ECMessages} of
		{match, [Head|Tail]} -> State#testWorld{outMessages=dict:store(ECName, Tail, OutMessages)};
		{none, FullList} -> State;
		{{scPatternMatch, SCName, SC},[Head|Tail]} -> State#testWorld{outMessages=dict:store(ECName, Tail, OutMessages), env=dict:store(SCName, SC, Env)}	
	end;
updateOutMessages(_, State) ->
	State.
	
outputExpectedMessage({ECName, MessageToCheck, {true, Output}}) ->
	{Control, Message} = Output,
	io:format("~p~n", [Message]);
outputExpectedMessage({ECName, MessageToCheck, {false, Output}}) ->
	io:format("~p~n", [Output]).
	

toString(Value) ->
	case Value of
		List when is_list(List) -> List;
		Num when is_integer(Num) -> integer_to_list(Num);
		Num when is_float(Num) -> float_to_list(Num);
		Atom when is_atom(Atom) -> atom_to_list(Atom)
	end.

messageToString({Name, {Key, Value}}, ECName) ->
	toString(Name) ++ "(" ++ toString(Key) ++ ", " ++ toString(Value) ++ ") at endCap: " ++ ECName;
messageToString({Name, Value}, ECName) ->
	toString(Name) ++ "(" ++ toString(Value) ++ ") at endCap: " ++ ECName.

	
parseRemoveCap(R, State) ->
	State.


parsePrim(R) when is_record(R, xmlElement) ->
	case R#xmlElement.name of
		number ->
			list_to_integer(getAtt(value, R));
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
	parse("../../../shared/testing/currentTest.xml").