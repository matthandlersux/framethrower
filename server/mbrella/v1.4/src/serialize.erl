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
-define (TABFILE, "data/serialize.ets").

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

start() -> start_link(empty).
start(FileName) -> start_link(FileName).
start_link(FileName) ->
	case gen_server:start_link({local, ?MODULE}, ?MODULE, [FileName], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.

serializeEnv() ->
	EnvDict = env:getAllAsDict(),
	AddIfObj = fun(_, ObjOrCell) ->
		case ObjOrCell of
			Obj when is_record(Obj, object) -> serializeObj(Obj, dict:new());
			Cell when is_record(Cell, exprCell) -> noSideEffect
		end
	end,
	dict:map(AddIfObj, EnvDict),
	ok.

serializeObj(Obj, InProcess) ->
	ObjName = Obj#object.name,
	NewInProcess = dict:store(ObjName, true, InProcess),
	NewProp = dict:map(fun (_, Property) -> serializeProp(Property, NewInProcess) end, Obj#object.prop),
	NewObj = Obj#object{prop = NewProp},
	gen_server:cast(?MODULE, {add, ObjName, NewObj}).
	
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
	mblib:exprElementToJson(Property).
	
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
	case ets:file2tab(FileName) of
		{ok, Table} ->
			State = #serialize{ets = Table};
		{error, _Reason} ->
			State = #serialize{}
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
handle_call({get, Expr}, From, State) ->
	case ets:lookup(?this(ets), Expr) of
		[{_, Reply}] ->
			good;
		[] -> 
			Reply = key_does_not_exist
	end,
    {reply, Reply, State}.

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
handle_cast({remove, Expr}, State) ->
	ets:delete(?this(ets), Expr),
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
	ets:tab2file(?this(ets), ?TABFILE),
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