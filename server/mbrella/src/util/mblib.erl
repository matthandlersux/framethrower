-module (mblib).
-compile (export_all).

-include ("../../include/scaffold.hrl").
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define(consKeysLeftRight, [3, 4] ).


%% ====================================================
%% Searching Functions
%% ====================================================

%% 
%% scour :: (a -> Bool) -> (b -> c) -> d -> d
%% 		basically will traverse any erlang term through lists and tuples to find elements that need to be converted
%%			and will return the whole structure with conversions made... similar to my old traverse function
%%		

scour(IsConvertable, Convert, Structure) ->
	case IsConvertable(Structure) of
		true ->
			Convert(Structure);
		false ->
			scourInto(IsConvertable, Convert, Structure)
	end.

%% 
%% scourInto :: (a -> Bool) -> (b -> b) -> c -> c
%% 		helper function for scour
%%		

scourInto(IsConvertable, Convert, [H|T]) ->
	[scour(IsConvertable, Convert, H)|scourInto(IsConvertable, Convert, T)];
scourInto(IsConvertable, Convert, Structure) when is_tuple(Structure) ->
	list_to_tuple(scourInto(IsConvertable, Convert, tuple_to_list(Structure)));
scourInto(_IsConvertable, _Convert, Structure) ->
	Structure.

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
			ElementsType = parseUtil:toTitle(atom_to_list(cell:elementsType(Tuple))),
			{struct, [{<<"kind">>, cell}, {<<"name">>, list_to_binary(cellPointer:name(Tuple))}, {<<"constructorType">>, list_to_binary(ElementsType)}]};
		false -> case objects:isObjectPointer(Tuple) of 
			true ->
				{Name, Type, Props} = objectStore:lookup(objects:getName(Tuple)),
				PropJson = lists:map(fun({PropName, PropValue}) ->
					{list_to_binary(PropName), exprElementToJson(PropValue)}
				end, Props),
				{struct, [{<<"kind">>, object}, {<<"name">>, list_to_binary(Name)}, {<<"type">>, list_to_binary(type:unparse(Type))}, {<<"props">>, {struct, PropJson}}]};
			false -> 
				%Tuple
				TupleList = lists:map(fun exprElementToJson/1, tuple_to_list(Tuple)),
				{struct, [{<<"kind">>, tuple}, {<<"asArray">>, TupleList}]}
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
		ClassType = type:makeTypeName(binary_to_list(Name)),
		objects:makeClass(ClassType, Prop)
	end, Classes).

createActions(SharedLetStruct) ->
	action:initJSON(SharedLetStruct).


%% applyMrg will execute the JSON action in FileName within the action root scope
%% FileName is relative to server folder
applyMrg(FileName) ->
	{ok, JSONBinary} = file:read_file(FileName),
	Struct = mochijson2:decode( binary_to_list( JSONBinary ) ),
	action:applyMrg(Struct).

%% applyShr will update the root action scope with any changes in bootJSON
applyShr() ->
	{ok, JSONBinary} = file:read_file("pipeline/priv/bootJSON"),
	BootJSON = mochijson2:decode( binary_to_list( JSONBinary ) ),
	SharedLetStruct = struct:get_value(<<"sharedLet">>, BootJSON),
	createActions(SharedLetStruct).


%% 
%% script that gets executed when the mbrella/pipeline application starts
%%

startScript(Options) ->
	spawn( fun() ->
		startGenServers(),
		Unserialize = case lists:keysearch(unserialize, 1, Options) of
			{value, {_, undefined}} -> false;
			{value, {_, USFileName}} -> true
		end,
		initBootJSON(Unserialize)		
	end).


initBootJSON(Unserialize) ->
	%read bootJSON file
	{ok, JSONBinary} = file:read_file("pipeline/priv/bootJSON"),
	BootJSON = mochijson2:decode( binary_to_list( JSONBinary ) ),
	ClassesStruct = struct:get_value(<<"classes">>, BootJSON),
	ExprLibStruct = struct:get_value(<<"exprLib">>, BootJSON),
	SharedLetStruct = struct:get_value(<<"sharedLet">>, BootJSON),

	%initialize classes and exprLib
	createClasses(ClassesStruct),
	createExprLib(ExprLibStruct),

	case Unserialize of
		false ->
			%starting server from scratch, applying initMrg
			createActions(SharedLetStruct),
			InitMrg = struct:get_value(<<"initMrg">>, BootJSON),
			action:applyMrg(InitMrg);
		true ->
			%starting server using serialized state
			serialize:unserialize(),
			createActions(SharedLetStruct)
	end.


startGenServers() ->
	sessionManager:start(),
	functionTable:create(),
	mewpile:new(),
	objects:start(),
	scope:start(),
	action:start(),
	cellStore:start(),
	objectStore:start(),
	serialize:start().
	
	
initializeDebugState() ->
	spawn( fun() ->
		startGenServers(),
		initBootJSON(false)
	end).