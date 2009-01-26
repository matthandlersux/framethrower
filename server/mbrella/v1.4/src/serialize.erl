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

start(FileName) -> start_link(FileName).
start_link(FileName) ->
	case gen_server:start_link({local, ?MODULE}, ?MODULE, [FileName], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.

serializeEnv() ->
	EnvDict = env:getAllAsDict(),
	AddIfObj = fun(_, ObjOrCellOrFunc) ->
		case ObjOrCellOrFunc of
			Obj when is_record(Obj, object) -> serializeObj(Obj, dict:new());
			_ -> noSideEffect
		end
	end,
	dict:map(AddIfObj, EnvDict),
	gen_server:cast(?MODULE, write),
	ok.

serializeObj(Obj, InProcess) ->
	ObjName = Obj#object.name,
	NewInProcess = dict:store(ObjName, true, InProcess),
	NewProp = dict:map(fun (_, Property) -> serializeProp(Property, NewInProcess) end, Obj#object.prop),
	NewObj = Obj#object{prop = NewProp},
	gen_server:cast(?MODULE, {add, ObjName, NewObj}),
	ObjName.
	
serializeCell(Cell, InProcess) ->
	Name = Cell#exprCell.name,	
	NewInProcess = dict:store(Name, true, InProcess),
	StateArray = cell:getStateArray(Cell),
	NewStateArray = lists:map(fun(Prop) -> serializeProp(Prop, NewInProcess) end, StateArray),
	NewCell = Cell#exprCell{pid=NewStateArray},
	gen_server:cast(?MODULE, {add, Name, NewCell}),
	Name.

serializeProp(Property, InProcess) when is_record(Property, exprCell) ->
	PropName = Property#exprCell.name,
	case dict:find(PropName, InProcess) of
		error -> serializeCell(Property, InProcess);
		_ -> PropName
	end;
serializeProp(Property, InProcess) when is_record(Property, object) ->
	PropName = Property#object.name,
	case dict:find(PropName, InProcess) of
		error -> serializeObj(Property, InProcess);
		_ -> PropName
	end;
serializeProp(Property, InProcess) ->
	binary_to_list(mblib:exprElementToJson(Property)).


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
	
	CellDict = ets:foldl(fun({Name, ObjOrCell}, Dict) -> 
		populateCells(ObjOrCell, CellDict)
	end, dict:new(), ?this(ets)),
	
	
    {noreply, State};
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.


unserializeProp(ObjOrCell, Dependencies) ->
	case ObjOrCell of
		Obj when is_record(Obj, object) ->
			unserializeObj(Obj, Dependencies);
		Cell when is_record(Cell, cell) ->
			unserializeCell(Cell, Dependencies);
	end.


makeCells(Cell, CellDict) when is_record(Cell, cell) ->
	NewCell = case type:isMap(Cell#exprCell.type) of
		true -> cell:makeCellMapInput();
		false -> cell:makeCell();
	end,
	dict:store(Cell#exprCell.name, NewCell, CellDict);
unserializeCells(_, CellDict) -> CellDict.

unserializeObjs(Obj, Dependencies) when is_record(Obj, object) ->
	
	;
unserializeObjs(Obj, Dependencies) ->
	Dependencies

unserializeObj(Obj, Dependencies) ->
	Prop = Obj#object.prop,
	NewProp = dict:map(fun(_, Property) -> unserializeProp(Property) end, Prop),
	NewObj = Obj#object{prop = NewProp},
	env:store(Obj#object.name, NewObj),
	NewObj.
	
unserializeCell(Cell, UpdateFuncs) ->
	.


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