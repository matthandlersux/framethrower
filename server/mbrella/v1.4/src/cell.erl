%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : a cell is a collection of dots...
%%%
%%% -------------------------------------------------------------------
-module(cell).

-behaviour(gen_server).
-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

%% --------------------------------------------------------------------
%% External exports
%-export([injectFunc/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%%For now, export all
-compile(export_all).


%% ====================================================================
%% Cell internal data structure record
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
	{ok, Pid} = gen_server:start(?MODULE, [ToKey], []),
	NewCell = #exprCell{pid=Pid},
	env:nameAndStoreCell(NewCell).
	
makeCellMapInput() ->
	ToKey = fun({Key,Val}) -> Key end,
	{ok, Pid} = gen_server:start(?MODULE, [ToKey], []),
	NewCell = #exprCell{pid=Pid},
	env:nameAndStoreCell(NewCell).

injectFunc(Cell, Fun) ->
	gen_server:call(Cell#exprCell.pid, {injectFunc, Fun}).

injectIntercept(Cell, Fun, InitState) ->
	gen_server:call(Cell#exprCell.pid, {injectIntercept, Fun, InitState}).

addOnRemove(Cell, Fun) ->
	gen_server:cast(Cell#exprCell.pid, {addOnRemove, Fun}).

setKeyRange(Cell, Start, End) ->
	gen_server:cast(Cell#exprCell.pid, {setKeyRange, Start, End}).

getStateArray(Cell) ->
	gen_server:call(Cell#exprCell.pid, getStateArray).

%% 
%% makeFuture:: Expr -> Cell
%% 

makeFuture(Value) ->
	Type = type:get(Value),
	Cell = (makeCell())#exprCell{type=Type},
	addLine(Cell, Value),
	Cell.

%% 
%% addline:: CellPid -> a -> CleanupFun
%% 

addLine(Cell, Value) ->
	gen_server:call(Cell#exprCell.pid, {addLine, Value}).

%% 
%% removeline:: CellPid -> a -> Atom
%% 
removeLine(Cell, Value) ->
	gen_server:cast(Cell#exprCell.pid, {removeLine, Value}).

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
		dots=rangedict:new(),
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
	Dot = try rangedict:fetch(Key, Dots) of
		{dot, Num, Val, Lines} -> {dot, Num+1, Val, Lines}
	catch
		_:_ -> onAdd({dot, 1, Value, dict:new()}, Funcs)
	end,
	NewDots = rangedict:store(Key, Dot, Dots),
	NewState = State#cell{dots=NewDots},
	Self = self(),
	CallBack = fun() -> 
		gen_server:cast(Self, {removeLine, Key}) end,
    {reply, CallBack, NewState};
handle_call({injectFunc, Fun}, From, State) ->
	#cell{funcs=Funcs, dots=Dots, funcColor=FuncColor} = State,
	Id = FuncColor,
	NewFuncs = dict:store(Id, Fun, Funcs),
	NewDots = rangedict:map(fun(Key, Dot) -> addLineResponse(Dot, Fun, Id) end, Dots),
	NewState = State#cell{funcColor=Id+1, funcs=NewFuncs, dots=NewDots},
	Self = self(),
    CallBack = fun() -> gen_server:cast(Self, {removeFunc, Id}) end,
    {reply, CallBack, NewState};
handle_call({injectIntercept, Fun, IntState}, From, State) ->
	Intercept = intercept:makeIntercept(Fun, IntState),
	NewState = State#cell{intercept=Intercept},
    {reply, Intercept, NewState};
handle_call(getStateArray, From, State) ->
	Dots = State#cell.dots,
	SortedDict = rangedict:toSortedDict(Dots),
	ResultArray = sorteddict:fold(fun(Key, Dot, Acc) -> 
		{dot, _, Val, _} = Dot,
		[Val|Acc]
	end, [], SortedDict),
	{reply, ResultArray, State}.


%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({removeLine, Value}, State) ->
	#cell{funcs=Funcs, dots=Dots} = State,
	NewDots = try rangedict:fetch(Value, Dots) of
		{dot, Num, Val, Lines} = Dot -> 
			if Num == 1 -> onRemove(Dot, Funcs),
						   rangedict:erase(Value, Dots);
			   true -> rangedict:store(Value, {dot, Num-1, Val, Lines}, Dots)
			end
	catch
		_:_ -> Dots
	end,
	NewState = State#cell{dots=NewDots},
    {noreply, NewState};
handle_cast({removeFunc, Id}, State) ->
	#cell{funcs=Funcs, dots=Dots} = State,
	NewFuncs = dict:erase(Id, Funcs),
	NewDots = rangedict:map(fun(Key, Dot) -> removeLineResponse(Dot, Id) end, Dots),
	NewState = State#cell{funcs=NewFuncs, dots=NewDots},
	%TODO: destroy this cell if Funcs is empty?
    {noreply, NewState};
handle_cast({addOnRemove, Fun}, State) ->
	#cell{onRemoves=OnRemoves} = State,
	NewState = State#cell{onRemoves=[Fun | OnRemoves]},
    {noreply, NewState};
handle_cast({setKeyRange, Start, End}, State) ->
	#cell{funcs=Funcs, dots=Dots} = State,
	OnAdd = fun(Val) ->
		onAdd(Val, Funcs)
	end,
	OnRemove = fun(Val) ->
		onRemove(Val, Funcs)
	end,
	NewDots = rangedict:setKeyRange({Start, End}, OnAdd, OnRemove, Dots),
    {noreply, State#cell{dots=NewDots}}.


%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info(_, State) ->
    {noreply, State}.

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