%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Fri Dec 19 13:24:05 EST 2008
%%% -------------------------------------------------------------------
-module(serialize).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
-define (ob(Field), mblib:getVal(Ob, Field)).
-define (this(Field), State#?MODULE.Field).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
%-define (TABFILE, "data/serialize.ets").

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

-include ("../include/scaffold.hrl").
-include ("../../lib/ast.hrl").

%% --------------------------------------------------------------------
%% External exports
-export([start/1]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-compile(export_all).



%% ====================================================================
%% External functions
%% ====================================================================

start(DefaultFileName) -> 
	start_link(DefaultFileName).
	
start_link(DefaultFileName) ->
	case gen_server:start({local, ?MODULE}, ?MODULE, [DefaultFileName], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.

serializeEnv() ->
	gen_server:cast(?MODULE, {serializeEnv, undefined}).

serializeEnv(FileName) ->
	gen_server:cast(?MODULE, {serializeEnv, FileName}).
	
unserialize() ->
	gen_server:call(?MODULE, {unserialize, undefined}).

unserialize(FileName) ->
	gen_server:call(?MODULE, {unserialize, FileName}).


updatePrepareState(PrepareStateStruct) ->
	gen_server:call(?MODULE, {updatePrepareState, PrepareStateStruct}).

getStateList() ->
	gen_server:call(?MODULE, getStateList).

stop() ->
	gen_server:call(?MODULE, stop).


%%SERIALIZE

serializeNow(ETS) ->
	EnvEts = env:getStateDict(),
	AddIfObj = fun({_, ObjOrCellOrFunc}, InProcess) ->
		case ObjOrCellOrFunc of
			Obj when is_record(Obj, object) -> 
				{_, NewInProcess} = serializeObj(Obj, InProcess, ETS),
				NewInProcess;
			_ -> InProcess
		end
	end,
	ets:foldl(AddIfObj, dict:new(), EnvEts),
	ok.

serializeObj(Obj, InProcess, ETS) ->
	ObjName = Obj#object.name,
	NewInProcess = dict:store(ObjName, true, InProcess),
	{UpdatedProp, UpdatedInProcess} = dict:fold(fun (PropName, Property, {InnerProp, InnerInProcess}) ->
		{NewProperty, NewInnerInProcess} = serializeProp(Property, InnerInProcess, ETS),
		NewProp = dict:store(PropName, NewProperty, InnerProp),
		{NewProp, NewInnerInProcess}
	end, {dict:new(), NewInProcess}, Obj#object.prop),
	NewObj = Obj#object{prop = UpdatedProp},
	ets:insert(ETS, {ObjName, NewObj}),
	{#objectPointer{name=ObjName}, UpdatedInProcess}.
	
serializeCell(CellPointer, InProcess, ETS) ->
	Name = CellPointer#cellPointer.name,
	NewInProcess = dict:store(Name, true, InProcess),
	StateArray = cell:getStateArray(CellPointer),
	{UpdatedStateArray, UpdatedInProcess} = lists:foldl(fun(Property, {InnerStateArray, InnerInProcess}) -> 
		{NewProperty, NewInnerInProcess} = serializeProp(Property, InnerInProcess, ETS),
		NewStateArray = [NewProperty|InnerStateArray],
		{NewStateArray, NewInnerInProcess}
	end, {[], NewInProcess}, StateArray),
	Cell = env:lookup(Name),
	NewCell = Cell#exprCell{pid=UpdatedStateArray},
	ets:insert(ETS, {Name, NewCell}),
	{#cellPointer{name=Name}, UpdatedInProcess}.

serializeProp(Property, InProcess, ETS) when is_record(Property, cellPointer) ->
	PropName = Property#cellPointer.name,
	case dict:find(PropName, InProcess) of
		error -> serializeCell(Property, InProcess, ETS);
		_ -> {#cellPointer{name=PropName}, InProcess}
	end;
serializeProp(Property, InProcess, ETS) when is_record(Property, objectPointer) ->
	PropName = Property#objectPointer.name,
	case dict:find(PropName, InProcess) of
		error -> 
			Object = env:lookup(PropName),
			serializeObj(Object, InProcess, ETS);
		_ -> {#objectPointer{name=PropName}, InProcess}
	end;
serializeProp(Property, InProcess, _) ->
	{Property, InProcess}.


%% UNSERIALIZE


unserializeNow(ETS) ->
	%unserialize all cells
	CellDict = ets:foldl(fun({Name, ObjOrCell}, Dict) -> 
		makeCells(ObjOrCell, Dict)
	end, dict:new(), ETS),
	%unserialize all objects, leaving old casting tables
	{EmptyDependencies, NewObjectDict} = ets:foldl(fun({Name, ObjOrCell}, {Dependencies, ObjectDict}) -> 
		tryMakeObject(ObjOrCell, Dependencies, CellDict, ObjectDict) 
	end, {dict:new(), dict:new()}, ETS),
	
	%map casting tables to new object names, and update objects in env
	dict:map(fun(Name, ObjPointer) ->
		Obj = env:lookup(ObjPointer#objectPointer.name), 
		mapCastingDict(Obj, NewObjectDict)
	end, NewObjectDict),
	%add objects/cells/primitives to all cells
	ets:foldl(fun({Name, ObjOrCell}, Acc) -> 
		populateCells(ObjOrCell, CellDict, NewObjectDict)
	end, acc, ETS),
	%add objects to memoTables
	
	dict:map(fun(Name, ObjPointer) -> 
		Obj = env:lookup(ObjPointer#objectPointer.name),
		memoizeObject(Obj)
	end, NewObjectDict),
	
	%update variables used in prepare state
	NewVariables = case ets:lookup(ETS, variables) of
		[{_, Variables}] ->
			VarsWithUndefined = lists:map(fun({VarName, ObjPointer}) ->
				case dict:find(ObjPointer#objectPointer.name, NewObjectDict) of
					{ok, NewPointer} -> {VarName, NewPointer};
					_ -> undefined
				end
			end, Variables),
			lists:filter(fun(Elem) ->
				case Elem of
					undefined -> false;
					_ -> true
				end
			end, VarsWithUndefined);
		_ ->
			[]
	end,
	NewVariables.	



makeCells(Cell, CellDict) when is_record(Cell, exprCell) ->
	NewCellPointer = cell:makeCell(),
	cell:done(NewCellPointer),
	NewCell = env:lookup(NewCellPointer#cellPointer.name),
	% TypedCell = NewCell#exprCell{type=Cell#exprCell.type, bottom=Cell#exprCell.bottom},
	TypedCell = NewCell#exprCell{type=Cell#exprCell.type},
	cell:update(TypedCell),
	dict:store(Cell#exprCell.name, NewCellPointer, CellDict);
makeCells(_, CellDict) -> CellDict.

tryMakeObject(Obj, Dependencies, CellDict, ObjectDict) when is_record(Obj, object) -> 
	PropsReady = dict:fold(fun(PropName, Property, AccBool) ->
		case AccBool of
			{false, _} -> AccBool;
			true ->
				case Property of
					ObjProp when is_record(ObjProp, objectPointer) ->
						case dict:find(ObjProp#objectPointer.name, ObjectDict) of
							error ->
								{false, ObjProp#objectPointer.name};
							_ -> true
						end;
					_ -> true
				end
		end
	end, true, Obj#object.prop),
	case PropsReady of
		true -> 
			NewProp = dict:map(fun(PropName, Property) ->
				unserializeProp(Property, CellDict, ObjectDict)
			end, Obj#object.prop),
			ObjWithProp = Obj#object{prop = NewProp},
			NewObj = case ObjWithProp#object.name of
				%need shared objects to keep the same name
				%this will write over the existing shared objects in the environment
				%TODO: may want a way to tell objects not to populate the root objects if we are using serialize
				"shared." ++ _ = ObjectName -> 
					env:store(ObjectName, ObjWithProp),
					ObjWithProp;
				_ -> env:nameAndStoreObj(ObjWithProp)
			end,
			NewObjectDict = dict:store(Obj#object.name, #objectPointer{name = NewObj#object.name}, ObjectDict),
			Deps = case dict:find(Obj#object.name, Dependencies) of
				error -> [];
				DepList -> DepList
			end,
			FewerDependencies = dict:erase(Obj#object.name, Dependencies),
			lists:foldl(fun(Dep, {InnerDependencies, InnerObjectDict}) -> 
				tryMakeObject(Dep, InnerDependencies, CellDict, InnerObjectDict)
			end, {FewerDependencies, NewObjectDict}, Deps);
		{false, DependName} ->
			CurDepList = case dict:find(DependName, Dependencies) of
				error -> [];
				DepList -> DepList
			end,
			NewDepList = [Obj|CurDepList],
			NewDependencies = dict:store(DependName, NewDepList, Dependencies),
			{NewDependencies, ObjectDict}
	end;
tryMakeObject(_, Dependencies, _, ObjectDict) -> {Dependencies, ObjectDict}.

mapCastingDict(Obj, ObjectDict) when is_record(Obj, object) ->
	CastingDict = Obj#object.castingDict,
	NewCastingDict = dict:map(fun(_, ObjName) ->
		(dict:fetch(ObjName, ObjectDict))#objectPointer.name
	end, CastingDict),
	UpdatedObj = Obj#object{castingDict = NewCastingDict},
	env:store(UpdatedObj#object.name, UpdatedObj);
mapCastingDict(_, _) -> nosideeffect.	

populateCells(Cell, CellDict, ObjectDict) when is_record(Cell, exprCell) -> 
	StateList = Cell#exprCell.pid,
	NewCellPointer = dict:fetch(Cell#exprCell.name, CellDict),
	NewProp = lists:map(fun(KeyOrKeyVal) ->
		Restored = case KeyOrKeyVal of
			{pair, Key, Val} -> {pair, unserializeProp(Key, CellDict, ObjectDict), unserializeProp(Val, CellDict, ObjectDict)};
			Key -> unserializeProp(Key, CellDict, ObjectDict)
		end,
		cell:addLine(NewCellPointer, Restored)
	end, StateList);
populateCells(_,_,_) -> nosideeffect.


unserializeProp(Property, CellDict, ObjectDict) ->
	case Property of
		ObjProp when is_record(ObjProp, objectPointer) ->
			dict:fetch(ObjProp#objectPointer.name, ObjectDict);
		CellProp when is_record(CellProp, cellPointer) ->
			dict:fetch(CellProp#cellPointer.name, CellDict);
		Other -> Other
	end.

memoizeObject(Obj) ->
	Prop = Obj#object.prop,
	NewProp = dict:map(fun(_, Property) ->
		case Property of
			CellPointer when is_record(CellPointer, cellPointer) ->
				% {Left, Right} = (Cell#exprCell.type)#type.value,
				% case atom_to_list(Left#type.value) of
					% "Future" ->
				%TODO:
				%This is a hack, we will send the state of all cells (even non future cells)
				%objects will only look at the ones that are used for memoizing, so it will not look at the non-future cells
				case cell:getStateArray(CellPointer) of
					[Val|_] -> Val;
					[] -> notused
				end;
			_ -> Property
		end
	end, Prop),	
	objects:addToMemoTable(Obj, NewProp).


comparePrepStates(OldPrepState, PrepareStateStruct, OldVariables) ->
	
	NewActions = lists:filter(fun(Elem) ->
		not(lists:member(Elem, OldPrepState))
	end, PrepareStateStruct),

	{_, Variables} = pipeline_web:processActionList(NewActions, [], OldVariables),
	Variables.


%% ====================================================================
%% Server functions
%% ====================================================================

%% --------------------------------------------------------------------
%% Function: init/1
%% Description: Initiates the server
%% Returns: {ok, State}          |
%%          {ok, State, Timeout} |
%%          ignore               |
%%          {stop, Reason}
%% --------------------------------------------------------------------
init([FileName]) ->
	process_flag(trap_exit, true),
	State = #serialize{
		file = FileName,
		prepareState = [],
		variables = []
	},
    {ok, State}.

%% --------------------------------------------------------------------
%% Function: handle_call/3
%% Description: Handling call messages
%% Returns: {reply, Reply, State}          |
%%          {reply, Reply, State, Timeout} |
%%          {noreply, State}               |
%%          {noreply, State, Timeout}      |
%%          {stop, Reason, Reply, State}   | (terminate/2 is called)
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_call({unserialize, FileName}, _, State) ->
	FileToUse = case FileName of
		undefined -> ?this(file);
		_ -> FileName
	end,
	NewState = case ets:file2tab(FileToUse) of
		{ok, Table} ->
			Variables = unserializeNow(Table),
			StateWithVar = State#serialize{variables = Variables},
			case ets:lookup(Table, prepareState) of
				[{_, PrepareState}] ->
					StateWithVar#serialize{prepareState = PrepareState};
				[] -> 
					StateWithVar
			end;
		_ ->
			State
	end,
    {reply, ok, NewState};
handle_call({updatePrepareState, PrepareStateStruct}, _, State) ->
	NewVariables = comparePrepStates(?this(prepareState), PrepareStateStruct, ?this(variables)),
	NewState = State#serialize{prepareState = PrepareStateStruct, variables = NewVariables},
	{reply, ok, NewState};
handle_call(stop, _, State) ->
	{stop, normal, stopped, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({serializeEnv, FileName}, State) ->
	FileToUse = case FileName of
		undefined -> ?this(file);
		_ -> FileName
	end,
	ETS = ets:new(serializeTable, []),
	serializeNow(ETS),
	ets:insert(ETS, {prepareState, ?this(prepareState)}),
	ets:insert(ETS, {variables, ?this(variables)}),
	ets:tab2file(ETS, FileToUse),
    {noreply, State};
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.


%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info(Info, State) ->
    {noreply, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(Reason, State) ->
	%ets:tab2file(?this(ets), ?this(file)),
	%ets:delete(?this(ets)),
    ok.

%% --------------------------------------------------------------------
%% Func: code_change/3
%% Purpose: Convert process state when code is changed
%% Returns: {ok, NewState}
%% --------------------------------------------------------------------
code_change(OldVsn, State, Extra) ->
    {ok, State}.

%% --------------------------------------------------------------------
%%% Internal functions
%% --------------------------------------------------------------------