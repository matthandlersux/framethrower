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
%-export([inject/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%%For now, export all
-compile(export_all).


%% ====================================================================
%% Cell internal data structure record
%% ====================================================================
% moved these records to scaffold
% -record(cellState, {funcs, dots, onRemoves=[], funcColor=0, intercept, done=false}).
% -record(depender, {function, cell, id, done}).
% -record(func, {function, depender}).


%% ====================================================================
%% External functions
%% ====================================================================

makeCell() -> 
	{ok, Pid} = gen_server:start(?MODULE, [], []),
	NewCell = #exprCell{pid=Pid},
	NamedCell = env:nameAndStoreCell(NewCell),
	#cellPointer{name = NamedCell#exprCell.name, pid = Pid}.

%% 
%% addline:: CellPid -> a -> CleanupFun
%% 

addLine(Cell, Value) ->
	gen_server:cast(Cell#cellPointer.pid, {addLine, Value, Cell#cellPointer.name}),
	Key = toKey(Value),
	fun() -> gen_server:cast(Cell#cellPointer.pid, {removeLine, Key}) end.

%% 
%% removeline:: CellPid -> a -> Atom
%% 
removeLine(Cell, Value) ->
	gen_server:cast(Cell#cellPointer.pid, {removeLine, Value}).




inject(Cell, Depender, Fun) ->
	Id = gen_server:call(Cell#cellPointer.pid, getColor),
	case Depender of
		OutputCell when is_record(OutputCell, cellPointer) -> addDependency(OutputCell, #depender{cell=Cell, id=Id});
		Intercept when is_pid(Intercept) -> intercept:addDependency(Intercept, #depender{cell=Cell, id=Id});
		DoneResponse when is_function(DoneResponse) -> nosideeffect
	end,
	gen_server:cast(Cell#cellPointer.pid, {inject, Depender, Fun, Cell, Id}),
	fun() -> removeFunc(Cell, Id) end.

removeFunc(Cell, Id) ->
	gen_server:cast(Cell#cellPointer.pid, {removeFunc, Id, Cell}).

injectIntercept(Cell, Fun, InitState) ->
	gen_server:call(Cell#cellPointer.pid, {injectIntercept, Fun, InitState, Cell}).

addOnRemove(Cell, OnRemove) ->
	gen_server:cast(Cell#cellPointer.pid, {addOnRemove, OnRemove}).




done(Cell) ->
	gen_server:cast(Cell#cellPointer.pid, {done, Cell}).

done(Cell, DoneDependency) ->
	gen_server:cast(Cell#cellPointer.pid, {done, DoneDependency, Cell}).

addDependency(Cell, Dependency) ->
	gen_server:cast(Cell#cellPointer.pid, {addDependency, Dependency}).

removeDependency(Cell, Dependency) ->
	gen_server:cast(Cell#cellPointer.pid, {removeDependency, Dependency, Cell}).

leash(Cell) ->
	addDependency(Cell, leash).

unleash(Cell) ->
	done(Cell, leash).





setKeyRange(Cell, Start, End) ->
	gen_server:cast(Cell#cellPointer.pid, {setKeyRange, Start, End}).

getStateArray(Cell) ->
	gen_server:call(Cell#cellPointer.pid, getStateArray).

getState(Cell) ->
	gen_server:call(Cell#cellPointer.pid, getState).



%% --------------------------------------------------------------------
%%% Internal functions
%% --------------------------------------------------------------------

toKey({pair, Key, _}) -> Key;
toKey(Key) -> Key.

addLineResponse(Dot, Fun, Id) ->
	{dot, Num, Value, Lines} = Dot,
	OnRemove = Fun(Value),
	case OnRemove of
		undefined -> Dot;
		OnRemRecord when is_record(OnRemRecord, depender) ->
			{dot, Num, Value, dict:store(Id, OnRemRecord#depender.function, Lines)};
		F -> {dot, Num, Value, dict:store(Id, F, Lines)}
	end.

removeLineResponse(Dot, Id) ->
	{dot, Num, Value, Lines} = Dot,
	NewLines = case dict:find(Id, Lines) of
		{ok, Function} ->
			Function(),
			dict:erase(Id, Lines);
		error -> Lines
	end,
	{dot, Num, Value, NewLines}.

onAdd(Dot, Funcs) ->
	AddFolder = fun(Id, Func, CurDot) -> 
		addLineResponse(CurDot, Func#func.function, Id) end,
	dict:fold(AddFolder, Dot, Funcs).

onRemove(Dot, Funcs) ->
	RemoveFolder = fun(Id, _) -> 
		removeLineResponse(Dot, Id) end,
	dict:map(RemoveFolder, Funcs),
	{ok}.

informDepender(Depender, Cell, FuncId) ->
	case Depender of
		OutputCell when is_record(OutputCell, cellPointer) -> done(OutputCell, #depender{cell=Cell, id=FuncId});
		Intercept when is_pid(Intercept) -> intercept:done(Intercept, #depender{cell=Cell, id=FuncId});
		DoneResponse when is_function(DoneResponse) -> DoneResponse();
		_ -> nosideeffect
	end.	

filterDependencies(Dependencies, DependencyToRemove) ->
	lists:filter(fun(Dependency) ->
		case Dependency of
			DependencyToRemove -> false;
			_ -> true
		end
	end, Dependencies).

checkDone(State, Cell) ->
	AllDone = case ?this(dependencies) of
		[] ->
			dict:map(fun(FuncId, Func) ->
				informDepender(Func#func.depender, Cell, FuncId)
			end, ?this(funcs)),
			true;
		_ -> false
	end,
	State#cellState{done=AllDone}.

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
init([]) ->
	process_flag(trap_exit, true),
    {ok, #cellState{
		funcs=dict:new(),
		dots=rangedict:new()
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
handle_call(getColor, _, State) ->
	Id = ?this(funcColor),
	NewState = State#cellState{funcColor=Id+1},
	{reply, Id, NewState};
handle_call({injectIntercept, Fun, IntState, Cell}, _, State) ->
	Intercept = intercept:makeIntercept(Fun, IntState, Cell),
	NewState = State#cellState{intercept=Intercept},
    {reply, Intercept, NewState};
handle_call(getStateArray, _, State) ->
	SortedDict = rangedict:toSortedDict(?this(dots)),
	ResultArray = sorteddict:fold(fun(Key, Dot, Acc) -> 
		{dot, _, Val, _} = Dot,
		[Val|Acc]
	end, [], SortedDict),
	{reply, ResultArray, State};
handle_call(getState, _, State) ->
	{reply, State, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({addLine, Value, CellName}, State) ->
	Key = toKey(Value),
	Dot = try rangedict:fetch(Key, ?this(dots)) of
		{dot, Num, Val, Lines} -> {dot, Num+1, Val, Lines}
	catch
		_:_ -> onAdd({dot, 1, Value, dict:new()}, ?this(funcs))
	end,
	NewDots = rangedict:store(Key, Dot, ?this(dots)),
	NewState = State#cellState{dots=NewDots},
    {noreply, NewState};
handle_cast({removeLine, Value}, State) ->
	NewDots = try rangedict:fetch(Value, ?this(dots)) of
		{dot, Num, Val, Lines} = Dot -> 
			if Num =< 1 -> onRemove(Dot, ?this(funcs)),
						   rangedict:erase(Value, ?this(dots));
			   true -> rangedict:store(Value, {dot, Num-1, Val, Lines}, ?this(dots))
			end
	catch
		_:_ -> ?this(dots)
	end,
	NewState = State#cellState{dots=NewDots},
    {noreply, NewState};
handle_cast({removeFunc, Id, Cell}, State) ->
	Func = dict:fetch(Id, ?this(funcs)),
	case Func#func.depender of
		OutputCell when is_record(OutputCell, cellPointer) -> removeDependency(OutputCell, #depender{cell=Cell, id=Id});
		Intercept when is_pid(Intercept) -> intercept:removeDependency(Intercept, #depender{cell=Cell, id=Id});
		%done function
		_ -> nosideeffect
	end,
	NewFuncs = dict:erase(Id, ?this(funcs)),
	NewDots = rangedict:map(fun(Key, Dot) -> removeLineResponse(Dot, Id) end, ?this(dots)),
	NewState = State#cellState{funcs=NewFuncs, dots=NewDots},
	case dict:size(NewFuncs) of
		0 ->
			%TODO: destroy this cell, for now we just remove all functions that are informing this cell
			nosideeffect;
			% lists:map(fun(OnRemove) ->
			% 	(OnRemove#depender.function)()
			% end, ?this(onRemoves));
		_ -> nosideeffect
	end,
    {noreply, NewState};
handle_cast({addOnRemove, OnRemove}, State) ->
	NewState = State#cellState{onRemoves=[OnRemove | ?this(onRemoves)]},
    {noreply, NewState};
handle_cast({addDependency, Dependency}, State) ->
	NewState = State#cellState{dependencies=[Dependency | ?this(dependencies)]},
    {noreply, NewState};
handle_cast({inject, Depender, Fun, Cell, Id}, State) ->
	NewFuncs = dict:store(Id, #func{function=Fun, depender=Depender}, ?this(funcs)),
	NewDots = rangedict:map(fun(Key, Dot) -> addLineResponse(Dot, Fun, Id) end, ?this(dots)),
	NewState = State#cellState{funcs=NewFuncs, dots=NewDots},
	case ?this(done) of
		true -> informDepender(Depender, Cell, Id);
		false -> nosideeffect
	end,
    {noreply, NewState};
handle_cast({removeDependency, DependencyToRemove, Cell}, State) ->
	NewDependencies = filterDependencies(?this(dependencies), DependencyToRemove),
	StateWithDependencies = State#cellState{dependencies=NewDependencies},
	NewState = case ?this(done) of
		true -> StateWithDependencies;
		false -> checkDone(StateWithDependencies, Cell)
	end,
    {noreply, NewState};
handle_cast({done, DoneDependency, Cell}, State) ->
	NewDependencies = filterDependencies(?this(dependencies), DoneDependency),
	StateWithDependencies = State#cellState{dependencies=NewDependencies},
	NewState = checkDone(StateWithDependencies, Cell),
    {noreply, NewState};
handle_cast({done, Cell}, State) ->
	dict:map(fun(FuncId, Func) ->
		informDepender(Func#func.depender, Cell, FuncId)
	end, ?this(funcs)),
	NewState = State#cellState{done=true},
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
