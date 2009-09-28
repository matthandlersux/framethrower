-module (mblib).
-compile (export_all).

-include ("../mbrella/include/scaffold.hrl").
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

%% MaybeStore for exprVars from type.erl
%% 
%% maybeStore:: Expr -> FreshVariable -> Env -> Env
%% 

maybeStore(#exprVar{index = OldVar} = Expr, NewVar, Env) when is_record(Expr, exprVar) ->
	maybeStore(OldVar, NewVar, Env);

%% 
%% maybeStore:: Key -> NewKey -> Dict -> Dict
%% 

maybeStore(OldVar, NewVar, Dict) ->
	try dict:fetch(OldVar, Dict) of
		_ -> Dict
	catch 
		_:_ -> dict:store(OldVar, NewVar, Dict)
	end.

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
	record_info(fields, session);
rInfo(cellState) ->
	record_info(fields, cellState).
	
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
%%		ExprElement:: Number | Bool | String | ExprCell | Object (later will be adding any evaluated Expr)
%% 


exprElementToJson(X) when is_integer(X) -> X1 = integer_to_list(X), list_to_binary(X1);
exprElementToJson(X) when is_float(X) -> X1 = float_to_list(X), list_to_binary(X1);
exprElementToJson(X) when is_boolean(X) -> list_to_binary(atom_to_list(X));
exprElementToJson(X) when is_atom(X) -> list_to_binary(atom_to_list(X));
exprElementToJson(X) when is_list(X) ->
	Fun = fun(XX) ->         
		if XX < 0 -> false;  
			XX > 255 -> false;
			true -> true      
		end                  
	end,
	case lists:all(Fun, X) of
		true -> 
			case X of
				[$<|_] -> list_to_binary(X);
				_ -> list_to_binary([$"] ++ X ++ [$"])
			end;
		false -> X
	end;
exprElementToJson(X) when is_pid(X) ->
	#exprCell{name = Name} = env:lookup(X),
	list_to_binary(Name);
exprElementToJson(CellPointer) when is_record(CellPointer, cellPointer) ->
	list_to_binary(CellPointer#cellPointer.name);
exprElementToJson(ObjectPointer) when is_record(ObjectPointer, objectPointer) ->
	list_to_binary(ObjectPointer#objectPointer.name);	
exprElementToJson(X) when is_record(X, exprCell) ->
	list_to_binary(X#exprCell.name);
exprElementToJson(X) when is_record(X, object) ->
	list_to_binary(X#object.name);	
exprElementToJson(X) -> X.


createExprLib(ExprLibStruct) ->
	Exprs = struct:to_list(ExprLibStruct),
	lists:map(fun(Anything) ->
		{BinName, BinExpr} = Anything,
		Name = binary_to_list(BinName),
		try 
			ParsedExpr = expr:exprParse(binary_to_list(BinExpr)),
			env:store(Name, {exprLib, ParsedExpr})
		catch
			_:_ -> nosideeffect
		end
	end, Exprs).

createClasses(ClassesStruct) ->
	Classes = struct:to_list(ClassesStruct),
	ClassesToMake = lists:map(fun(Anything) ->
		{Name, Fields} = Anything,
		BinProp = struct:to_list(struct:get_value(<<"prop">>, Fields)),
		Prop = lists:map(fun({PropName, PropVal}) ->
			{binary_to_list(PropName), binary_to_list(PropVal)}
		end, BinProp),

		InheritBin = struct:get_value(<<"inherit">>, Fields),
		MemoizeBin = struct:get_value(<<"memoize">>, Fields),

		WithProps = #classToMake{ name = binary_to_list(Name),prop = Prop},
		WithInherit = case InheritBin of
			undefined -> WithProps;
			_ -> WithProps#classToMake{inherit = binary_to_list(InheritBin)}
		end,
		case MemoizeBin of
			undefined -> WithInherit;
			_ ->
				Memoize = lists:map(fun(MemoField) ->
					binary_to_list(MemoField)
				end, MemoizeBin),
				WithInherit#classToMake{memoize = Memoize}
		end
	end, Classes),
	objects:makeClasses(ClassesToMake).

createRootObjects(RootObjectsStruct) ->
	RootObjects = struct:to_list(RootObjectsStruct),
	lists:foreach(fun({Name, Type}) ->
		objects:createWithName(binary_to_list(Type), dict:new(), binary_to_list(Name))
	end, RootObjects).


%% 
%% function to load bootJSON file and run it against the server on bootup to populate objects and cells etc...
%% 

% bootJsonScript() ->
% 	spawn( fun() -> bootJsonScriptLoop() end ).



startScript(Options) ->
	spawn( fun() ->
		sessionManager:start(),
		memoize:start(),
		env:start(),
		objects:start(),
		mblib:bootJsonScript(),
	
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
		mblib:prepareStateScript(),
		case lists:keysearch(responsetime, 1, Options) of
			{value, {_, true}} ->
				responseTime:start();
			_ ->
				nosideeffect
		end
	end).

%% 
%% script that gets executed when the mbrella/pipeline application starts
%% 

bootJsonScript() ->
	{ok, JSONBinary} = file:read_file("lib/bootJSON"),
	Struct = mochijson2:decode( binary_to_list( JSONBinary ) ),
	ClassesStruct = struct:get_value(<<"classes">>, Struct),
	RootObjectsStruct = struct:get_value(<<"rootObjects">>, Struct),
	ExprLibStruct = struct:get_value(<<"exprLib">>, Struct),

	createClasses(ClassesStruct),
	createRootObjects(RootObjectsStruct),
	createExprLib(ExprLibStruct),

	bootedJSONScript.

prepareStateScript() ->
	{ok, JSONBinary} = file:read_file("lib/bootJSON"),
	Struct = mochijson2:decode( binary_to_list( JSONBinary ) ),	
	PrepareStateStruct = struct:get_value(<<"prepareState">>, Struct),
	UpdatedStruct = serialize:updatePrepareState(PrepareStateStruct),
	preparedState.



	% case inets:start() of
	% 	ok ->
	% 		receive
	% 		after 2000 ->
	% 				case http:request("http://localhost:8000/newSession") of
	% 					{ok, {_, _, "{" ++ SessionId}} ->
	% 						{ok, JSONBinary} = file:read_file("lib/bootJSON"),
	% 					    {ok, _} = http:request(
	% 							post,
	% 							{
	% 								"http://localhost:8000/action",
	% 								[],
	% 								"application/x-www-form-urlencoded",
	% 								"json={\"actions\":" ++ binary_to_list(JSONBinary) ++ ", " ++ SessionId
	% 							},
	% 							[],
	% 							[]
	% 						);
	% 					_ -> erlang:error(couldnt_load_boot_json)
	% 				end
	% 		end;
	% 	_ -> erlang:error(couldnt_start_inets)
	% end,
	% inets:stop(),