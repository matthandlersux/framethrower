-module(testsyntax).
-compile(export_all).
-include("../include/scaffold.hrl").
-include_lib("xmerl/include/xmerl.hrl").

-record(testWorld, {env=expr:getEnv(default), endCaps=dict:new(), outMessages=[], testOutput=[]}).
% 
% parseAll(D) ->
% 	% find all RSS files underneath D
% 	FL = filelib:fold_files(D, ".+.rss$", true, fun(F, L) -> [F|L] end, []),
% 	[ parse(F) || F <- FL ].


parse(FName) ->
	% parses a single RSS file
	{R,_} = xmerl_scan:file(FName),
	State = #testWorld{},
	spawn(fun() -> 
		L = extract(R,State)
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
			lists:foldl(fun extract/2, State, R#xmlElement.content);
		startcap ->
			parseStartCap(R, State);
		endcap ->
			parseEndCap(R, State);
		messages ->
			parseMessages(R, State);
		expectedMessages ->
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
	#testWorld{env=Env} = State,
	Name = getAtt(name, R),
	Expression = getAtt(expression, R),
	EC = eval:evaluate(expr:expr(Expression), Env),
	
	Self = self(),
	cell:injectFunc(EC, fun(Val) -> 
		Self ! {response, Name, {set, Val}},
		fun() -> Self ! {response, Name, {remove, Val}} end
	end),
	State.
	
%private helper function
parseArgs(R) ->
	GetArg = fun(InnerR, L) ->
		case parsePrim(InnerR) of
			undefined -> L;
			Prim -> [Prim | L]
		end
	end,
	Result = lists:foldl(GetArg, [], R#xmlElement.content),
	case Result of
		[A,B|[]] -> {A,B};
		[A|[]] -> A;
		[] -> noArgs
	end.

extractMessage(R, State) when is_record(R, xmlElement) ->
	#testWorld{env=Env} = State,
	GetStartCap = fun() ->
		SCName = getAtt(scname, R),
		StartCap = dict:fetch(SCName, Env)
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
	loop(ExpectedMessages, State).

extractExpectedMessage(R, ExpectedMessages) when is_record(R, xmlElement) ->
	ECName = getAtt(ecname, R),
	MessageToCheck = {R#xmlElement.name, parseArgs(R)},
	ExpectedMessages ++ [{{ECName, MessageToCheck}, false}];
extractExpectedMessage(_, State) -> State.  % ignore any other text data

loop(ExpectedMessages, State) ->
	#testWorld{outMessages=OutMessages} = State,
	receive
		{response, ECName, Message} ->
			ECMessages = dict:fetch(ECName, OutMessages),
			NewOutMessages = dict:store(ECName, ECMessages ++ [Message], OutMessages),
			NewState = State#testWorld{outMessages=NewOutMessages},
			
			NewExpectedMessages = lists:map(fun(EMessage) -> checkIncomingMessage(EMessage, NewState) end, ExpectedMessages),
			Finished = lists:foldl(fun({_,_,Done}, Truth) -> Truth and Done end, true, ExpectedMessages),
			if
				Finished == true -> 
					lists:foldL(fun outputExpectedMessage/2, NewState, NewExpectedMessages);
				true -> loop(NewExpectedMessages, NewState)
			end
	after 1000 ->
		io:format("Test Timed Out", [])
	end.
	
checkIncomingMessage({ECName, MessageToCheck, {true, Output}}, State) -> {ECName, MessageToCheck, {true, Output}};
checkIncomingMessage({ECName, MessageToCheck, {false, _}}, State) ->
	#testWorld{env=Env, outMessages=OutMessages, testOutput=TestOutput} = State,
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
	case Response of
		match -> {true, {match, "Confirmed Message: " ++ messageToString(MessageToCheck, ECName)}};
		none -> {true, {none, "Confirmed Message: " ++ messageToString(MessageToCheck, ECName)}};
		{scPatternMatch, SCName, SC} -> {true, {{scPatternMatch, SCName, SC}, "Confirmed Message: " ++ messageToString(MessageToCheck, ECName)}};
		{badMatch, WrongMessage} -> {false, "Error: Expected Message: " ++ messageToString(MessageToCheck, ECName) ++ ", but received message " ++ messageToString(WrongMessage, ECName)};
		noMessage -> {false, "Error: Expected Message: " ++ messageToString(MessageToCheck, ECName) ++ ", but received NO Message"}
	end.
	
outputExpectedMessage({ECName, MessageToCheck, {true, Output}}, State) ->
	#testWorld{env=Env, outMessages=OutMessages, testOutput=TestOutput} = State,
	{Control, Message} = Output,
	io:format("~p~n", [Message]),

	ECMessages = dict:fetch(ECName, OutMessages),
	
	NewECMessages = case {Control, ECMessages} of
		{match, [Head|Tail]} -> State#testWorld{outMessages=Tail};
		{none, FullList} -> State#testWorld{outMessages=FullList};
		{{scPatternMatch, SCName, SC},[Head|Tail]} -> State#testWorld{outMessages=Tail, env=dict:store(SCName, SC, Env)}
		
	end,
	NewOutMessages = dict:store(ECName, NewECMessages, OutMessages),
	State#testWorld{outMessages=NewOutMessages};
outputExpectedMessage({ECName, MessageToCheck, {false, Output}}, State) ->
	io:format("~p~n", [Output]),
	State.
	

messageToString({Name, {Key, Value}}, ECName) ->
	Name ++ "(" ++ Key ++ ", " ++ Value ++ ") at endCap: " ++ ECName;
messageToString({Name, Value}, ECName) ->
	Name ++ "(" ++ Value ++ ") at endCap: " ++ ECName.

	
parseRemoveCap(R, State) ->
	State.


parsePrim(R) when is_record(R, xmlElement) ->
	case R#xmlElement.name of
		number ->
			getAtt(value, R);
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