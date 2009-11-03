-module (mblib).
-compile (export_all).

-include ("../../include/scaffold.hrl").
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define(consKeysLeftRight, [3, 4] ).


%% ====================================================
%% Searching Functions
%% ====================================================

%% 
%% traverse:: Tuple -> Fun -> Tuple
%%		takes any tuple and applies Fun to every element, Fun should be strictly defined
%%		to only process what it's looking for so that try/catch can do the right thing 
%%		
%%		the try catch may be what slows this down
%% 

traverse( Expr, Do ) when is_tuple(Expr) ->
	list_to_tuple( traverseHelper( tuple_to_list(Expr), Do ) );
traverse( Expr, _ ) -> Expr.

%% 
%% traverseHelper:: List -> Fun -> List
%% 

traverseHelper( [], _ ) -> [];
traverseHelper( [H|T], Do ) ->
	H1 = 	try Do(H)
			catch 
				_:_ ->	if 
							is_tuple(H) -> traverse(H, Do);
							true -> H
						end
			end,
	[H1 | traverseHelper( T, Do)].
	
%% 
%% replaceElement:: Tuple -> List Natural -> (Tuple -> Tuple) -> Tuple
%% 

replaceElement( Expr, ElementList, ApplyFun) ->
	FoldFun = fun(X, Acc) ->
				setelement(X, Acc, ApplyFun( element(X, Expr)))
			end,
	lists:foldl( FoldFun, Expr, ElementList).
	
%% ====================================================
%% Utilities
%% ====================================================

%% 
%% pump:: List a -> (a -> b) -> Tuple b
%%
%% 		ex: 
% Username = proplists:get_value("username", Data),
% Password = proplists:get_value("password", Data),
% 
% transforms to
% 
% {Username, Password} = pump(["username", "password"], fun(X) -> proplists:get_value(X, Data) end),
%% 
pump(List, Fun) when is_function(Fun, 1) ->
	list_to_tuple( pumpList(List, Fun) ).

pumpList([], _) -> [];
pumpList([H|T], Fun) ->
	[Fun(H)|pumpList(T, Fun)].

%% 
%% catchElements is used to store elements while another function runs, this is a helper function
%% 
catchElements() ->
	spawn(fun() -> catchElements([]) end).
	
catchElements(Vars) ->
	receive
		{add, Var} ->
			catchElements(Vars ++ [Var]);
		%Andrew: I changed this to take a Ref because eval was receiving interceptor messages
		{return, Pid, Ref} ->
			Pid ! {Ref, Vars}
	end.

%% ====================================================
%% Record dealing functions
%% ====================================================

recordKeysToIndex(RecordName, KeyList) when is_atom(RecordName) ->
	recordKeysToIndex(rInfo(RecordName), KeyList);
recordKeysToIndex(_, []) -> [];
recordKeysToIndex(FieldList, [Key|KeyList]) ->
	[recordKeysToIndex(FieldList, Key)|recordKeysToIndex(FieldList, KeyList)];
recordKeysToIndex(FieldList, Key) ->
	which(Key, FieldList) + 1.

rInfo(object) ->
	record_info(fields, object);
rInfo(exprCell) ->
	record_info(fields, exprCell);
rInfo(exprFun) ->
	record_info(fields, exprFun);
rInfo(exprApply) ->
	record_info(fields, exprApply);
rInfo(exprLambda) ->
	record_info(fields, exprLambda);
rInfo(session) ->
	record_info(fields, session).
% rInfo(cellState) ->
% 	record_info(fields, cellState).
	
%% 
%% which figures out the placement of an element in a record
%% 
which(E, F) ->
	case lists:member(E, F) of
		true ->
			which(E, F, 1);
		false ->
			0
	end.

which(_, [], Pos) ->
	Pos;
which(E, [H|T], Pos) ->
	if
		H =:= E ->
			Pos;
		true ->
			which(E, T, Pos + 1)
	end.
	
%% ====================================================
%% functional functions - worst section name ever :(
%% ====================================================

curry(Func) ->
	{arity, Arity} = erlang:fun_info(Func, arity),
	curry(Func,Arity, []).
curry(Func, 0, Args) -> apply(Func, Args);
curry(Func, Arity, Args) -> 
	fun(Arg) -> curry(Func, Arity-1, Args ++ [Arg])	end.


%% ====================================================
%% 'stringify' function
%% ====================================================

%% 
%% exprElementToJson:: ExprElement -> JSON
%%		ExprElement:: Number | Bool | Atom | String | CellPointer | ObjectPointer
%% 

exprElementToJson(X) when is_list(X) -> list_to_binary(X);
exprElementToJson(Tuple) when is_tuple(Tuple) ->
	case cellPointer:isCellPointer(Tuple) of
		true ->
			{struct, [{<<"kind">>, cell}, {<<"name">>, list_to_binary(cellPointer:name(Tuple))}]};
		false -> case objects:isObjectPointer(Tuple) of 
			true ->
				{_, _, Props} = objectStore:lookup(objects:getName(Tuple)),
				PropJson = lists:map(fun({PropName, PropValue}) ->
					{list_to_binary(PropName), exprElementToJson(PropValue)}
				end, Props),
				{struct, [{<<"kind">>, object}, {<<"props">>, {struct, PropJson}}]};
			false -> throw("error in mblib:exprElementToJson")
		end
	end;
exprElementToJson(X) -> X.


createExprLib(ExprLibStruct) ->
	Exprs = struct:to_list(ExprLibStruct),
	lists:map(fun(Anything) ->
		{BinName, BinExpr} = Anything,
		Name = binary_to_list(BinName),
		try 
			ParsedExpr = parse:parse(binary_to_list(BinExpr))
			% cellStore:store(Name, {exprLib, ParsedExpr})
			%TODO: add expr to functionTable?
		catch
			_:_ -> nosideeffect
		end
	end, Exprs).

createClasses(ClassesStruct) ->
	Classes = struct:to_list(ClassesStruct),
	lists:map(fun(Anything) ->
		{Name, Fields} = Anything,
		BinProp = struct:to_list(struct:get_value(<<"prop">>, Fields)),
		Prop = lists:map(fun({PropName, PropVal}) ->
			PropType = type:parse(binary_to_list(PropVal)),
			{binary_to_list(PropName), PropType}
		end, BinProp),
		ClassType = type:makeTypeName(list_to_atom(string:to_lower(binary_to_list(Name)))),
		objects:makeClass(ClassType, Prop)
	end, Classes).

createActions(SharedLetStruct) ->
	action:initJSON(SharedLetStruct).

%% 
%% script that gets executed when the mbrella/pipeline application starts
%%

startScript(Options) ->
	spawn( fun() ->
		sessionManager:start(),

		functionTable:create(),
		mewpile:new(),
		objects:start(),
		action:start(),
		cellStore:start(),
		objectStore:start(),
		bootJsonScript("pipeline/priv/bootJSON"),
	
		case lists:keysearch(serialize, 1, Options) of
			{value, {_, undefined}} ->
				serialize:start();
			{value, {_, SFileName}} ->
				serialize:start(SFileName)
		end,
		case lists:keysearch(unserialize, 1, Options) of
			{value, {_, undefined}} ->
				nosideeffect;
			{value, {_, USFileName}} ->
				serialize:unserialize(USFileName)
		end,
		% TODO: get serialize working again
		% mblib:prepareStateScript(),

		case lists:keysearch(responsetime, 1, Options) of
			{value, {_, true}} ->
				responseTime:start();
			_ ->
				nosideeffect
		end
	end).

%% 
%% function to load bootJSON file and run it against the server on bootup to populate objects and cells etc...
%%

bootJsonScript(BootJsonFile) ->
	{ok, JSONBinary} = file:read_file(BootJsonFile),
	Struct = mochijson2:decode( binary_to_list( JSONBinary ) ),
	ClassesStruct = struct:get_value(<<"classes">>, Struct),
	ExprLibStruct = struct:get_value(<<"exprLib">>, Struct),
	SharedLetStruct = struct:get_value(<<"sharedLet">>, Struct),

	createClasses(ClassesStruct),
	createExprLib(ExprLibStruct),
	createActions(SharedLetStruct),

	bootedJSONScript.

prepareStateScript() ->
	{ok, JSONBinary} = file:read_file("lib/bootJSON"),
	Struct = mochijson2:decode( binary_to_list( JSONBinary ) ),	
	PrepareStateStruct = struct:get_value(<<"prepareState">>, Struct),
	serialize:updatePrepareState(PrepareStateStruct),
	preparedState.


initializeDebugState() ->
	% Add more here
	functionTable:create(),
	mewpile:new(),
	objects:start(),
	action:start(),
	cellStore:start(),
	objectStore:start(),
	bootJsonScript("priv/bootJSON").