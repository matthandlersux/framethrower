%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : a cell is a collection of dots...
%%%
%%% -------------------------------------------------------------------
-module(cell).

-behaviour(gen_server).

%% --------------------------------------------------------------------
%% External exports
%-export([injectFunc/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%%For now, export all
-compile(export_all).


%% ====================================================================
%% Cell data structure record
%% ====================================================================
-record(cell, {funcs, dots, toKey, onRemoves=[], funcColor=0, intercept}).

%% ====================================================
%% Types
%% ====================================================

%% 
%% Value:: Nat | Bool | String | Cell | {Value, Value}
%% Cell:: Pid
%% Pid:: < Nat . Nat . Nat >
%% 

%% ====================================================================
%% External functions
%% ====================================================================

makeCell() -> 
	ToKey = fun(X) -> X end,
	{ok, Pid} = gen_server:start_link(?MODULE, [ToKey], []),
	Pid.
	
makeCellAssocInput() ->
	ToKey = fun({Key,Val}) -> Key end,
	{ok, Pid} = gen_server:start_link(?MODULE, [ToKey], []),
	Pid.

injectFunc(CellPid, Fun) ->
	gen_server:call(CellPid, {injectFunc, Fun}).

injectIntercept(CellPid, Fun, InitState) ->
	gen_server:cast(CellPid, {injectIntercept, Fun, InitState}).

sendIntercept(CellPid, Message) ->
	gen_server:cast(CellPid, {sendIntercept, Message}).

addOnRemove(CellPid, Fun) ->
	gen_server:cast(CellPid, {addOnRemove, Fun}).

%% 
%% addline:: CellPid -> a -> CleanupFun
%% 

addLine(CellPid, Value) ->
	gen_server:call(CellPid, {addLine, Value}).

%% 
%% removeline:: CellPid -> a -> Atom
%% 
removeLine(CellPid, Value) ->
	gen_server:cast(CellPid, {removeLine, Value}).

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
init([ToKey]) ->
	process_flag(trap_exit, true),
    {ok, #cell{
		funcs=dict:new(),
		dots=dict:new(),
		toKey=ToKey
	}}.

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
handle_call({addLine, Value}, From, State) ->
	#cell{funcs=Funcs, dots=Dots, toKey=ToKey} = State,
	Key = ToKey(Value),
	Dot = try dict:fetch(Key, Dots) of
		{dot, Num, Value, Lines} -> {dot, Num+1, Value, Lines}
	catch
		_:_ -> {dot, 1, Value, dict:new()}
	end,
	NewDot = onAdd(Dot, Funcs),
	NewDots = dict:store(Key, NewDot, Dots),
	NewState = State#cell{dots=NewDots},
	Self = self(),
	CallBack = fun() -> 
		gen_server:cast(Self, {removeLine, Key}) end,
    {reply, CallBack, NewState};
handle_call({injectFunc, Fun}, From, State) ->
	#cell{funcs=Funcs, dots=Dots, funcColor=FuncColor} = State,
	Id = FuncColor,
	NewFuncs = dict:store(Id, Fun, Funcs),
	NewDots = dict:map(fun(Key, Dot) -> addLineResponse(Dot, Fun, Id) end, Dots),
	NewState = State#cell{funcColor=Id+1, funcs=NewFuncs, dots=NewDots},
	Self = self(),
    CallBack = fun() -> gen_server:cast(Self, {removeFunc, Id}) end,
    {reply, CallBack, NewState}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({removeLine, Value}, State) ->
	#cell{funcs=Funcs, dots=Dots} = State,
	NewDots = try dict:fetch(Value, Dots) of
		{dot, Num, Value, Lines} = Dot -> 
			if Num == 1 -> onRemove(Dot, Funcs),
						   dict:erase(Value, Dots);
			   true -> dict:store(Value, {dot, Num-1, Value, Lines}, Dots)
			end
	catch
		_:_ -> Dots
	end,
	NewState = State#cell{dots=NewDots},
    {noreply, NewState};
handle_cast({removeFunc, Id}, State) ->
	#cell{funcs=Funcs, dots=Dots} = State,
	NewFuncs = dict:erase(Id, Funcs),
	NewDots = dict:map(fun(Key, Dot) -> removeLineResponse(Dot, Id) end, Dots),
	NewState = State#cell{funcs=NewFuncs, dots=NewDots},
	%TODO: destroy this cell if Funcs is empty?
    {noreply, NewState};
handle_cast({injectIntercept, Fun, IntState}, State) ->
	NewState = State#cell{intercept={Fun, IntState}},
    {noreply, NewState};
handle_cast({sendIntercept, Message}, State) ->
	#cell{intercept={Fun, IntState}} = State,
	NewIntState = Fun(Message, IntState),
	NewState = State#cell{intercept={Fun, NewIntState}},
    {noreply, NewState};
handle_cast({addOnRemove, Fun}, State) ->
	#cell{onRemoves=OnRemoves} = State,
	NewState = State#cell{onRemoves=[Fun | OnRemoves]},
    {noreply, NewState}.

%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info({data, Data}, State) ->
	handle_cast({data, Data}, State),
    {noreply, State};
handle_info({get, state}, State) ->
	{reply, State, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(Reason, State) ->
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



addLineResponse(Dot, Fun, Id) ->
	{dot, Num, Value, Lines} = Dot,
	OnRemove = Fun(Value),
	case OnRemove of
		undefined -> Dot;
		F -> {dot, Num, Value, dict:store(Id, OnRemove, Lines)}
	end.

removeLineResponse(Dot, Id) ->
	{dot, Num, Value, Lines} = Dot,
	NewLines = try dict:fetch(Id, Lines) of
		OnRemove -> OnRemove(),
					dict:erase(Id, Lines)
	catch
		_:_ -> Lines
	end,
	{dot, Num, Value, NewLines}.

onAdd(Dot, Funcs) ->
	AddFolder = fun(Id, Fun, CurDot) -> 
		addLineResponse(CurDot, Fun, Id) end,
	dict:fold(AddFolder, Dot, Funcs).

onRemove(Dot, Funcs) ->
	RemoveFolder = fun(Id, Fun) -> 
		removeLineResponse(Dot, Id) end,
	dict:map(RemoveFolder, Funcs),
	{ok}.