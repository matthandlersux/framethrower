%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : a cell is a collection of dots...
%%%
%%% -------------------------------------------------------------------
-module(cell).

-behaviour(gen_server).
-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#cellState.Field).

%% --------------------------------------------------------------------
%% External exports
%-export([injectFunc/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3, update/1]).

%%For now, export all
-compile(export_all).


%% ====================================================================
%% Cell internal data structure record
%% ====================================================================
-record(cellState, {funcs, dots, toKey, onRemoves=[], funcColor=0, intercept}).

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

update(Cell) ->
	Name = Cell#exprCell.name,
	env:store(Name, Cell).
	
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
	TypeString = type:unparse(type:get(Value)),
	FutureType = type:parse("Future " ++ TypeString),
	Cell = (makeCell())#exprCell{type=FutureType},
	update(Cell),
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
    {ok, #cellState{
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
	Key = (?this(toKey))(Value),
	Dot = try rangedict:fetch(Key, ?this(dots)) of
		{dot, Num, Val, Lines} -> {dot, Num+1, Val, Lines}
	catch
		_:_ -> onAdd({dot, 1, Value, dict:new()}, ?this(funcs))
	end,
	NewDots = rangedict:store(Key, Dot, ?this(dots)),
	NewState = State#cellState{dots=NewDots},
	Self = self(),
	CallBack = fun() -> 
		gen_server:cast(Self, {removeLine, Key}) end,
    {reply, CallBack, NewState};
handle_call({injectFunc, Fun}, From, State) ->
	Id = ?this(funcColor),
	NewFuncs = dict:store(Id, Fun, ?this(funcs)),
	NewDots = rangedict:map(fun(Key, Dot) -> addLineResponse(Dot, Fun, Id) end, ?this(dots)),
	NewState = State#cellState{funcColor=Id+1, funcs=NewFuncs, dots=NewDots},
	Self = self(),
    CallBack = fun() -> gen_server:cast(Self, {removeFunc, Id}) end,
    {reply, CallBack, NewState};
handle_call({injectIntercept, Fun, IntState}, From, State) ->
	Intercept = intercept:makeIntercept(Fun, IntState),
	NewState = State#cellState{intercept=Intercept},
    {reply, Intercept, NewState};
handle_call(getStateArray, From, State) ->
	SortedDict = rangedict:toSortedDict(?this(dots)),
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
	NewDots = try rangedict:fetch(Value, ?this(dots)) of
		{dot, Num, Val, Lines} = Dot -> 
			if Num == 1 -> onRemove(Dot, ?this(funcs)),
						   rangedict:erase(Value, ?this(dots));
			   true -> rangedict:store(Value, {dot, Num-1, Val, Lines}, ?this(dots))
			end
	catch
		_:_ -> ?this(dots)
	end,
	NewState = State#cellState{dots=NewDots},
    {noreply, NewState};
handle_cast({removeFunc, Id}, State) ->
	NewFuncs = dict:erase(Id, ?this(funcs)),
	NewDots = rangedict:map(fun(Key, Dot) -> removeLineResponse(Dot, Id) end, ?this(dots)),
	NewState = State#cellState{funcs=NewFuncs, dots=NewDots},
	%TODO: destroy this cell if Funcs is empty?
    {noreply, NewState};
handle_cast({addOnRemove, Fun}, State) ->
	NewState = State#cellState{onRemoves=[Fun | ?this(onRemoves)]},
    {noreply, NewState};
handle_cast({setKeyRange, Start, End}, State) ->
	OnAdd = fun(Val) ->
		onAdd(Val, ?this(funcs))
	end,
	OnRemove = fun(Val) ->
		onRemove(Val, ?this(funcs))
	end,
	NewDots = rangedict:setKeyRange({Start, End}, OnAdd, OnRemove, ?this(dots)),
    {noreply, State#cellState{dots=NewDots}}.


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
