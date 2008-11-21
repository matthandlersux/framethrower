-module (process).
-compile( export_all).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).

new(InChannels, OutChannels, CoreFun) ->
	spawn_link(fun() ->
				process_flag(trap_exit, true),
				Process = initProcess(InChannels, OutChannels, CoreFun),
				loop(Process, []) 
				end ).

% a process should receive {data, [{channel, Name}], Data} and either respond with 
% 		{data, [{channel, Name1}], Data1}
% 		or not do anything
% so a process needs to receive messages and pass messages to the outputs if necessary
% initializing a process for a box needs InChannelNames = list(Name), OutChannels = list({Name, Pid})
% we want a process to be universal so it needs to be typed on inputs and outputs, eventually
% 		we'll want it to take list(Attrib = list(Name, Type, etc..)) or something like that

% so a process should be a fun(channel, data) -> [{data, [{channel, Channel1}], Data1}]
% 	possibly a special keyword {channel, all} to send data to all
% 
% a process can make other objects but must kill them when it dies, may need to kill some specifically
% 	so it needs to keep track, also useful for debugging
		
loop(Process, Children) ->
	receive
		{data, Attributes, Data} ->
			% ?d("Process received:", {data, Attributes, Data}),
			Channel = getChannel(Attributes),
			case Process(Channel, Data) of
				{data, Attributes1, Data1} ->
					PidList = getPidList(Attributes1),
					NewChildren = getNewChildren(Attributes1),
					stream(PidList, {data, Data1}),
					loop(Process, Children ++ NewChildren);
				_ ->
					loop(Process, Children)
			end;
		debug ->
			io:format("~nChildren of Process:~n~n~p~n~n", [Children]),
			loop(Process, Children)
	end.

%% 
%% crossRefLoop is a wrapper for the corefun that prevents inputs from interfering with outputs if there is overlap
%% 		CrossRef -> [OutData]
%% 


crossRefLoop(In, Out, CoreFun, CrossRef) ->
	receive
		{From, Channel, Data} ->
			case CoreFun(Channel, Data) of
				{data, Attributes, ReturnData} ->
					% this is where we prevent interference
					CrossRef1 = addCrossRefData(ReturnData, CrossRef),
					% this is where you can play with deciding how to direct inputs
					case getPidList(Attributes) of
						all ->
							{_, PidList} = lists:unzip(Out),
							From ! {data, lists:keyreplace(pidList, 1, Attributes, {pidList, PidList}), ReturnData};
						_ ->
							From ! false
					end;
				false -> 
					CrossRef1 = CrossRef,
					From ! false
			end,
			crossRefLoop(In, Out, CoreFun, CrossRef1)
		debug ->
			
	end.

addCrossRefData(OutData, CrossRef) when is_list(OutData) ->
	lists:fold(fun(E, A) -> addCrossRefData(E, A) end, OutData);
addCrossRefData({add, Val} = OutData, CrossRef) ->
	case lists:keytake(Val, 1, CrossRef) of
		{value, {_, Num}, Rest} ->
			Rest ++ [{Val, Num + 1}];
		false ->
			CrossRef ++ [{Val, 1}]
	end;
addCrossRefData({remove, Val} = InData, OutData, CrossRef) ->
	case lists:keytake(Val, 1, CrossRef) of
		{value, {_, 1}, Rest} ->
			Rest;
		{value, {_, Num}, Rest} ->
			CrossRef ++ [{Val, Num - 1}];
		false ->
			?d("Weird behavior in crossRef.", false),
			CrossRef
	end;
addCrossRefData(InData, OutData, CrossRef) ->
	CrossRef ++ [{InData, OutData}]

initProcess(In, Out, CoreFun) ->
	ProcessPid = spawn(fun() -> crossRefLoop(In, Out, CoreFun, []) end),
	fun(Channel, Data) ->
		ProcessPid ! {self(), Channel, Data},
		receive 
			Msg ->
				Msg
		end
	end.

% initProcess(In, Out, CoreFun) ->
% 	fun(Channel, Data) ->
% 		case CoreFun(Channel, Data) of
% 			{data, Attributes, ReturnData} ->
% 				% this is where you can play with deciding how to direct inputs
% 				case getPidList(Attributes) of
% 					all ->
% 						{_, PidList} = lists:unzip(Out),
% 						{data, lists:keyreplace(pidList, 1, Attributes, {pidList, PidList}), ReturnData};
% 					_ ->
% 						false
% 				end;
% 			false -> false
% 		end
% 	end.

stream([], _) -> [];
stream([H|T], Data) ->
	stream(H, Data),
	stream(T, Data);
stream(Pid, Data) ->
	Pid ! Data.
							
getNewChildren(Attributes) ->
	case getField(Attributes, newChildren) of
		false -> [];
		Anything -> Anything
	end.
	
getChannel(Attributes) ->
	getField(Attributes, channel).

getPidList(Attributes) ->
	getField(Attributes, pidList).
	
getField(List, Field) ->
	case lists:keysearch(Field, 1, List) of
		{value, {Field, Value}} ->
			Value;
		false ->
			false
	end.
	
%% ====================================================
%% useful processes
%% ====================================================

filterListEvens(_, {Op, Value}) ->
	case Value rem 2 of
		0 ->
			{data, [{pidList, all}], {Op, Value}};
		_ ->
			false
	end.
	
% if a function creates processes, then return attribute {newChildren, [Pid1, Pid2, ...]}