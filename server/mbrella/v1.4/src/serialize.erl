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
	CellDict = ets:foldl(fun({Name, ObjOrCell}, Dict) -> 
		makeCells(ObjOrCell, Dict)
	end, dict:new(), ?this(ets)),
	
	EmptyDependencies = ets:foldl(fun({Name, ObjOrCell}, Dependencies) -> 
		tryMakeObject(ObjOrCell, Dependencies, CellDict) 
	end, dict:new(), ?this(ets)),
	
	ets:foldl(fun({Name, ObjOrCell}, Acc) -> 
		populateCells(ObjOrCell, CellDict)
	end, acc, ?this(ets)),
	
	
    {noreply, State};
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.


tryMakeObject(Obj, Dependencies, CellDict) when is_record(Obj, object) -> 
	PropsReady = dict:fold(fun(PropName, Property, AccBool) ->
		case AccBool of
			{false, _} -> AccBool;
			true ->
				case Property of
					ObjProp when is_record(ObjProp, object) ->
						case env:lookup(ObjProp#object.name) of
							notfound -> {false, ObjProp#object.name};
							_ -> true
						end;
					_ -> true
				end
		end
	end, true, Obj#object.prop),
	UpdatedDependencies = case PropsReady of
		true -> 
			NewProp = dict:map(fun(PropName, Property) ->
				unserializeProp(Property, CellDict)
			end, Obj#object.prop),
			NewObj = Obj#object{prop = NewProp},
			env:store(NewObj#object.name, NewObj),
			Deps = case dict:find(NewObj#object.name, Dependencies) of
				error -> [];
				DepList -> DepList
			end,
			FewerDependencies = dict:erase(NewObj#object.name, Dependencies),
			lists:foldl(fun(Dep, InnerDependencies) -> 
				tryMakeObject(Dep, InnerDependencies, CellDict)
			end, FewerDependencies, Deps);
		{false, DependName} ->
			CurDepList = case dict:find(DependName, Dependencies) of
				error -> [];
				DepList -> DepList
			end,
			NewDepList = [Obj|CurDepList],
			dict:store(DependName, NewDepList, Dependencies)
	end,
	UpdatedDependencies;
tryMakeObject(_, Dependencies, _) -> Dependencies.

populateCells(Cell, CellDict) when is_record(Cell, exprCell) -> 
	StateList = Cell#exprCell.pid,
	NewCell = dict:fetch(Cell#exprCell.name, CellDict),
	NewProp = lists:map(fun(KeyOrKeyVal) ->
		Restored = case KeyOrKeyVal of
			{Key, Val} -> {unserializeProp(Key, CellDict), unserializeProp(Val, CellDict)};
			Key -> unserializeProp(Key, CellDict)
		end,
		cell:addLine(NewCell, Restored)
	end, StateList);
populateCells(_,_) -> nosideeffect.


unserializeProp(Property, CellDict) ->
	case Property of
		ObjProp when is_record(ObjProp, object) ->
			case env:lookup(ObjProp#object.name) of
				notfound -> error;
				Obj -> Obj
			end;
		CellProp when is_record(CellProp, exprCell) ->
			dict:fetch(CellProp#exprCell.name, CellDict);
		Other -> Other
	end.

makeCells(Cell, CellDict) when is_record(Cell, exprCell) ->
	NewCell = case type:isMap(Cell#exprCell.type) of
		true -> cell:makeCellMapInput();
		false -> cell:makeCell()
	end,
	TypedCell = NewCell#exprCell{type=Cell#exprCell.type, bottom=Cell#exprCell.bottom},
	cell:update(TypedCell),
	dict:store(Cell#exprCell.name, TypedCell, CellDict);
makeCells(_, CellDict) -> CellDict.

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
	ets:tab2file(?this(ets), ?this(file)),
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