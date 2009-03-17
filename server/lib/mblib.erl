-module (mblib).
-compile (export_all).

-include ("../mbrella/v1.4/include/scaffold.hrl").
-define(consKeysLeftRight, [3, 4] ).

%% ====================================================
%% Searching Functions
%% ====================================================



%% 
%% lookForExprVar:: String -> Term -> LookFor
%% LookFor:: Expr -> {ok, Expr} | {next, List Natural}
%% 

lookForExprVar(VarName, Replace) ->
	fun( Expr ) when is_record(Expr, exprVar) ->
			case Expr#exprVar.value of
				VarName ->
					{ok, Replace};
				_ ->
					{ok, Expr}
			end
	end.

%%	Traverse is like lists:keysearch except that it traverses nested tuples rather than a tuple list
%%		LookFor is a function that checks a tuple, decides if it needs to be replaced and does so
%%		or it tells Traverse to continue traversing specific elements of the tuple
%% 
%% traverse:: Tuple -> LookFor -> Tuple
%%		LookFor:: Tuple -> {ok, replacedexpr} | {next, ListOfElementsToTraverse}

traverse( Expr, LookFor) ->
	LookFor1 = fun( CalledExpr ) ->
				try LookFor( CalledExpr )
				catch 
					_:_ ->
						traverseCons( CalledExpr )
				end
			end,
	traverse1( Expr, LookFor1 ).


traverse1( Expr, LookFor) ->
	case LookFor(Expr) of
		{ok, Replaced} ->
			Replaced;
		{next, ElementList} ->
			replaceElement(Expr, ElementList, fun(X) -> traverse1(X, LookFor) end)
	end.

%% 
%% traverseCons is a package function for traverse LookFor functions
%% 

traverseCons( Expr ) when is_record(Expr, cons) ->
	% ElementList = recordKeysToIndex( cons, [left, right]),
	ElementList = ?consKeysLeftRight,
	{next, ElementList};
traverseCons( Expr ) -> 
	{ok, Expr}.
	
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

maybeStore(#exprVar{value = OldVar} = Expr, NewVar, Env) when is_record(Expr, exprVar) ->
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

rInfo(cons) ->
	record_info(fields, cons).
	
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
	Info = erlang:fun_info(Func),
	[{arity, Arity}] = lists:filter(fun(E) -> case E of {arity,_} -> true; _->false end end, Info),
	curry(Func,Arity, []).
curry(Func, 0, Args) -> apply(Func, Args);
curry(Func, Arity, Args) -> fun(Arg) -> curry(Func, Arity-1, Args ++ [Arg])	end.


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


%% 
%% function to load bootJSON file and run it against the server on bootup to populate objects and cells etc...
%% 

bootJsonScript() ->
	spawn( fun() -> bootJsonScriptLoop() end ).
	
bootJsonScriptLoop() ->
	SessionId = session:new(),
	{ok, JSONBinary} = file:read_file("lib/bootJSON"),
	pipeline_web:processActionList( mochijson2:decode( binary_to_list( JSONBinary ) ) ),
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
	bootedJSONScript.