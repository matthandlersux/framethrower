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
-include ("../../../lib/ast.hrl").

%% --------------------------------------------------------------------
%% External exports
-export([start/1]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-compile(export_all).



%% ====================================================================
%% External functions
%% ====================================================================

start(FileName) -> 
	start_link(FileName).
start_link(FileName) ->
	case gen_server:start({local, ?MODULE}, ?MODULE, [FileName], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.

serializeEnv() ->
	EnvDict = env:getAllAsDict(),
	AddIfObj = fun(_, ObjOrCellOrFunc, InProcess) ->
		case ObjOrCellOrFunc of
			Obj when is_record(Obj, object) -> 
				{_, NewInProcess} = serializeObj(Obj, InProcess),
				NewInProcess;
			_ -> InProcess
		end
	end,
	dict:fold(AddIfObj, dict:new(), EnvDict),
	Response = gen_server:cast(?MODULE, write),
	ok.

serializeObj(Obj, InProcess) ->
	ObjName = Obj#object.name,
	NewInProcess = dict:store(ObjName, true, InProcess),
	{UpdatedProp, UpdatedInProcess} = dict:fold(fun (PropName, Property, {InnerProp, InnerInProcess}) ->
		{NewProperty, NewInnerInProcess} = serializeProp(Property, InnerInProcess),
		NewProp = dict:store(PropName, NewProperty, InnerProp),
		{NewProp, NewInnerInProcess}
	end, {dict:new(), NewInProcess}, Obj#object.prop),
	NewObj = Obj#object{prop = UpdatedProp},
	gen_server:cast(?MODULE, {add, ObjName, NewObj}),
	{ObjName, UpdatedInProcess}.
	
serializeCell(Cell, InProcess) ->
	Name = Cell#exprCell.name,	
	NewInProcess = dict:store(Name, true, InProcess),
	StateArray = cell:getStateArray(Cell),
	{UpdatedStateArray, UpdatedInProcess} = lists:foldl(fun(Property, {InnerStateArray, InnerInProcess}) -> 
		{NewProperty, NewInnerInProcess} = serializeProp(Property, InnerInProcess),
		NewStateArray = [NewProperty|InnerStateArray],
		{NewStateArray, NewInnerInProcess}
	end, {[], NewInProcess}, StateArray),
	NewCell = Cell#exprCell{pid=UpdatedStateArray},
	gen_server:cast(?MODULE, {add, Name, NewCell}),
	{Name, UpdatedInProcess}.

serializeProp(Property, InProcess) when is_record(Property, exprCell) ->
	PropName = Property#exprCell.name,
	case dict:find(PropName, InProcess) of
		error -> serializeCell(Property, InProcess);
		_ -> {PropName, InProcess}
	end;
serializeProp(Property, InProcess) when is_record(Property, object) ->
	PropName = Property#object.name,
	case dict:find(PropName, InProcess) of
		error -> serializeObj(Property, InProcess);
		_ -> {PropName, InProcess}
	end;
serializeProp(Property, InProcess) ->
	{binary_to_list(mblib:exprElementToJson(Property)), InProcess}.


unserialize() ->
	gen_server:cast(?MODULE, unserialize).


getStateList() ->
	gen_server:call(?MODULE, getStateList).
	
die() ->
	gen_server:cast(?MODULE, {terminate, killed}).

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
	State = case ets:file2tab(FileName) of
		{ok, Table} ->
			#serialize{ets = Table, file = FileName};
		{error, _Reason} ->
			#serialize{file = FileName}
	end,
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
handle_call(getStateList, From, State) ->
	% case ets:lookup(?this(ets), Expr) of
	% 	[{_, Reply}] ->
	% 		good;
	% 	[] -> 
	% 		Reply = key_does_not_exist
	% end,
    {reply, ets:tab2list(?this(ets)), State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({add, Name, Elem}, State) ->
	ets:insert(?this(ets), {Name, Elem}),
    {noreply, State};
handle_cast(write, State) ->
	ets:tab2file(?this(ets), ?this(file)),
    {noreply, State};
handle_cast(unserialize, State) ->
	%unserialize all cells
	CellDict = ets:foldl(fun({Name, ObjOrCell}, Dict) -> 
		makeCells(ObjOrCell, Dict)
	end, dict:new(), ?this(ets)),
	%unserialize all objects, leaving old casting tables
	{EmptyDependencies, NewObjectDict} = ets:foldl(fun({Name, ObjOrCell}, {Dependencies, ObjectDict}) -> 
		tryMakeObject(ObjOrCell, Dependencies, CellDict, ObjectDict) 
	end, {dict:new(), dict:new()}, ?this(ets)),
	%map casting tables to new object names, and update objects in env
	ets:foldl(fun({Name, ObjOrCell}, Acc) -> 
		mapCastingDict(ObjOrCell, NewObjectDict)
	end, acc, ?this(ets)),
	%add objects/cells/primitives to all cells
	ets:foldl(fun({Name, ObjOrCell}, Acc) -> 
		populateCells(ObjOrCell, CellDict, NewObjectDict)
	end, acc, ?this(ets)),
	%add objects to memoTables
	dict:map(fun(Name, Obj) -> 
		memoizeObject(Obj)
	end, NewObjectDict),
	
	
    {noreply, State};
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.

makeCells(Cell, CellDict) when is_record(Cell, exprCell) ->
	NewCell = case type:isMap(Cell#exprCell.type) of
		true -> cell:makeCellMapInput();
		false -> cell:makeCell()
	end,
	TypedCell = NewCell#exprCell{type=Cell#exprCell.type, bottom=Cell#exprCell.bottom},
	cell:update(TypedCell),
	dict:store(Cell#exprCell.name, TypedCell, CellDict);
makeCells(_, CellDict) -> CellDict.

tryMakeObject(Obj, Dependencies, CellDict, ObjectDict) when is_record(Obj, object) -> 
	PropsReady = dict:fold(fun(PropName, Property, AccBool) ->
		case AccBool of
			{false, _} -> AccBool;
			true ->
				case Property of
					ObjProp when is_record(ObjProp, object) ->
						case dict:find(ObjProp#object.name, ObjectDict) of
							error -> {false, ObjProp#object.name};
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
			NewObj = env:nameAndStoreObj(Obj#object{prop = NewProp}),
			NewObjectDict = dict:store(Obj#object.name, NewObj, ObjectDict),
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
		NewObj = dict:fetch(Obj#object.name, ObjectDict),
		NewObj#object.name
	end, CastingDict),
	UpdatedObj = Obj#object{castingDict = NewCastingDict},
	env:store(UpdatedObj#object.name, UpdatedObj);
mapCastingDict(_, _) -> nosideeffect.	

populateCells(Cell, CellDict, ObjectDict) when is_record(Cell, exprCell) -> 
	StateList = Cell#exprCell.pid,
	NewCell = dict:fetch(Cell#exprCell.name, CellDict),
	NewProp = lists:map(fun(KeyOrKeyVal) ->
		Restored = case KeyOrKeyVal of
			{Key, Val} -> {unserializeProp(Key, CellDict, ObjectDict), unserializeProp(Val, CellDict, ObjectDict)};
			Key -> unserializeProp(Key, CellDict, ObjectDict)
		end,
		cell:addLine(NewCell, Restored)
	end, StateList);
populateCells(_,_,_) -> nosideeffect.


unserializeProp(Property, CellDict, ObjectDict) ->
	case Property of
		ObjProp when is_record(ObjProp, object) ->
			dict:fetch(ObjProp#object.name, ObjectDict);
		CellProp when is_record(CellProp, exprCell) ->
			dict:fetch(CellProp#exprCell.name, CellDict);
		Other -> Other
	end.

memoizeObject(Obj) ->
	Prop = Obj#object.prop,
	NewProp = dict:map(fun(_, Property) ->
		case Property of
			Cell when is_record(Cell, exprCell) ->
				case atom_to_list((Cell#exprCell.type)#type.value) of
					"Future" ->
						[Val] = cell:getStateList(Property),
						Val;
					_ -> Property
				end;
			_ -> Property
		end
	end, Prop),
	objects:addToMemoTable(Obj, NewProp).

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