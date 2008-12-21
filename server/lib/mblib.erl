-module (mblib).
-compile (export_all).

-include ("../mbrella/v1.4/include/scaffold.hrl").

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
			end;
		( Expr ) when is_record(Expr, cons) ->
			ElementList = recordKeysToIndex( cons, [left, right]),
			{next, ElementList};
		( Expr ) -> {ok, Expr}
	end.

%%	Traverse is like lists:keysearch except that it traverses nested tuples rather than a tuple list
%%		LookFor is a function that checks a tuple, decides if it needs to be replaced and does so
%%		or it tells Traverse to continue traversing specific elements of the tuple
%% 
%% traverse:: Tuple -> LookFor -> Tuple
%%		LookFor:: Tuple -> {ok, replacedexpr} | {next, ListOfElementsToTraverse}

traverse( Expr, LookFor) ->
	case LookFor(Expr) of
		{ok, Replaced} ->
			Replaced;
		{next, ElementList} ->
			replaceElement(Expr, ElementList, fun(X) -> traverse(X, LookFor) end)
	end.

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