%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : a cell is a collection of dots...
%%%
%%% -------------------------------------------------------------------
-module(cell).
-behaviour(gen_server).
% -compile(export_all).

-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define(this(Field), State#cellState.Field).

%% Exports
-export([makeCell/0, addLine/2, removeLine/2, injectDependency/2, inject/3, removeFunc/2, injectIntercept/3, addOnRemove/2, clear/1]).
-export([done/1, done/2, addDependency/2, removeDependency/2, leash/1, unleash/1]).
-export([setKeyRange/3, getStateArray/1, getState/1]).

%% gen_server exports
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).


%% ====================================================
%% TYPES
%% ====================================================
%% elem is the type of things that can be stored in a cell
%%		elem can be any erlang term, but we expect it to be one of the following:
%%			String, Number, Atom
%%			cellPointer, objectPointer, funPointer
%%			exprFun
%%			{pair, elem, elem}  (this is used for cells that are maps)
%% these records are defined in scaffold.hrl:
%% 		#depender
%% 		#func
%% 		#dot
%%		#cellState

%% ====================================================================
%% External API
%% ====================================================================

%%----------------------------------------------------------------------
%% Function: makeCell/0
%% Purpose: Create a new cell and store it in the environment
%% Args: none
%% Side Effect: adds created cell to environment
%% Returns: cellPointer
%%----------------------------------------------------------------------
makeCell() -> 
	{ok, Pid} = gen_server:start(?MODULE, [], []),
	NewCell = #exprCell{pid=Pid},
	NamedCell = env:nameAndStoreCell(NewCell),
	#cellPointer{name = NamedCell#exprCell.name, pid = Pid}.

%%----------------------------------------------------------------------
%% Function: addLine/2
%% Purpose: add a line to this cell
%% Args:   Cell is cellPointer, Value is element.
%% Returns: A function that will remove this line
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
addLine(Cell, Value) ->
	gen_server:cast(Cell#cellPointer.pid, {addLine, Value, Cell#cellPointer.name}),
	Key = toKey(Value),
	fun() -> gen_server:cast(Cell#cellPointer.pid, {removeLine, Key}) end.

%%----------------------------------------------------------------------
%% Function: removeLine/0
%% Purpose: remove a line from this cell
%% Args: Cell is cellPointer, Value is element
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
removeLine(Cell, Value) ->
	gen_server:cast(Cell#cellPointer.pid, {removeLine, Value}).

%%----------------------------------------------------------------------
%% Function: inject/3
%% Purpose: Injects a function to be run on all dots in the cell, and a depender to inform when the cell is done
%% 			If the depender is a cell, this also injects on onRemove into depender to inform this cell when depender dies
%% Args: Cell is cellPointer, Depender is cellPointer|function
%% Returns: A function to remove this injected function
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
inject(Cell, Depender, Fun) ->
	Id = gen_server:call(Cell#cellPointer.pid, getColor),
	case Depender of
		OutputCell when is_record(OutputCell, cellPointer) -> addDependency(OutputCell, #depender{cell=Cell, id=Id});
		Intercept when is_pid(Intercept) -> intercept:addDependency(Intercept, #depender{cell=Cell, id=Id});
		DoneResponse when is_function(DoneResponse) -> nosideeffect
	end,
	gen_server:cast(Cell#cellPointer.pid, {inject, Depender, Fun, Cell, Id}),
	fun() -> removeFunc(Cell, Id) end.

%%----------------------------------------------------------------------
%% Function: injectDependency/0
%% Purpose: Set up the same dependency behavior as with inject, but not tied to any injected function
%% Args: Cell is cellPointer, Depender is cellPointer|function
%% Returns: A function to remove this dependency
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
injectDependency(Cell, Depender) ->
	inject(Cell, Depender, undefined).


%%----------------------------------------------------------------------
%% Function: injectIntercept/3
%% Purpose: Creates a process with a state that multiple cells can send messages to.
%%			The intercept will process the messages and send updates to the cell.
%% Args: Cell is cellPointer, Fun is a function that will process received messages and update the intercept state
%%		InitState is the starting state of the intercept.
%% Returns: 
%%     or {error, Reason} (if the process is dead)
%% eg: injectIntercept(OutputCell, fun(Message, {intState, Num}) -> ... {intState, Num+1} end, {intState, 0})
%%----------------------------------------------------------------------
injectIntercept(Cell, Fun, InitState) ->
	gen_server:call(Cell#cellPointer.pid, {injectIntercept, Fun, InitState, Cell}).


%%----------------------------------------------------------------------
%% Function: addOnRemove/2
%% Purpose: add a function that will be called when this cell dies
%% Args: Cell is cellPointer, OnRemove is function
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
addOnRemove(Cell, OnRemove) ->
	gen_server:cast(Cell#cellPointer.pid, {addOnRemove, OnRemove}).

%%----------------------------------------------------------------------
%% Function: clear/1
%% Purpose: remove all lines to this cell
%% Args: Cell is cellPointer
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
clear(Cell) ->
	gen_server:call(Cell#cellPointer.pid, clear).


%%----------------------------------------------------------------------
%% Function: done/1
%% Purpose: tells a "root" cell that it is done being initialized
%% Args: Cell is cellPointer
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
done(Cell) ->
	gen_server:cast(Cell#cellPointer.pid, {done, Cell}).

%%----------------------------------------------------------------------
%% Function: leash/1
%% Purpose: tells a cell that it can't be done until it is "unleashed"
%% Args: Cell is cellPointer
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
leash(Cell) ->
	addDependency(Cell, leash).

%%----------------------------------------------------------------------
%% Function: unleash/0
%% Purpose: removes the restriction imposed by "leash"
%% Args: Cell is cellPointer
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
unleash(Cell) ->
	done(Cell, leash).

%%----------------------------------------------------------------------
%% Function: setKeyRange/3
%% Purpose: tell the cell only to process dots between Start and End
%% Args: Cell is cellPointer, Start and End are elem
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
setKeyRange(Cell, Start, End) ->
	gen_server:cast(Cell#cellPointer.pid, {setKeyRange, Start, End}).


%%----------------------------------------------------------------------
%% Function: getStateArray/0
%% Purpose: get the dots in the cell
%% Args: Cell is cellPointer
%% Returns: [#dot{}]
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
getStateArray(Cell) ->
	gen_server:call(Cell#cellPointer.pid, getStateArray).

%%----------------------------------------------------------------------
%% Function: getState/1
%% Purpose: get the cell state for debugging
%% Args: Cell is cellPointer
%% Returns: #cellState{}
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
getState(Cell) ->
	gen_server:call(Cell#cellPointer.pid, getState).



%% --------------------------------------------------------------------
%% Almost Internal API (these functions are only used by Cell and Intercept)
%% --------------------------------------------------------------------


%%----------------------------------------------------------------------
%% Function: done/2
%% Purpose: lets one cell tell a dependant cell that it is done
%% Args: Cell is cellPointer, DoneDependency is #depender{}
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
done(Cell, DoneDependency) ->
	gen_server:cast(Cell#cellPointer.pid, {done, DoneDependency, Cell}).


%%----------------------------------------------------------------------
%% Function: addDependency/2
%% Purpose: tells a cell that it isn't done until Dependency is done
%% Args: Cell is cellPointer, Dependency is #depender{}
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
addDependency(Cell, Dependency) ->
	gen_server:cast(Cell#cellPointer.pid, {addDependency, Dependency}).


%%----------------------------------------------------------------------
%% Function: removeDependency/2
%% Purpose: tells a cell that it no longer needs to wait for Dependency to be done
%% Args: Cell is cellPointer, Dependency is #depender{}
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
removeDependency(Cell, Dependency) ->
	gen_server:cast(Cell#cellPointer.pid, {removeDependency, Dependency, Cell}).




%% --------------------------------------------------------------------
%% Internal API
%% --------------------------------------------------------------------

%%----------------------------------------------------------------------
%% Function: removeFunc/2
%% Purpose: Removes injected function from cell
%% Args: Cell is cellPointer, Id is the 'color' of the injected function to be removed
%% Returns: ok
%%     or {error, Reason} (if the process is dead)
%%----------------------------------------------------------------------
removeFunc(Cell, Id) ->
	gen_server:cast(Cell#cellPointer.pid, {removeFunc, Id, Cell}).


runFunOnDot(Dot, Fun, Id) ->
	Undo = Fun(Dot#dot.value),
	case Undo of
		undefined -> Dot;
		F -> Dot#dot{lines = dict:store(Id, F, Dot#dot.lines)}
	end.

undoFunOnDot(Dot, Id) ->
	Lines = Dot#dot.lines,
	NewLines = case dict:find(Id, Lines) of
		{ok, Function} ->
			Function(),
			dict:erase(Id, Lines);
		error -> Lines
	end,
	Dot#dot{lines = NewLines}.

addFirstLine(Dot, Funcs) ->
	AddFolder = fun(Id, Func, CurDot) -> 
		case Func#func.function of
			undefined -> CurDot;
			Fun -> runFunOnDot(CurDot, Fun, Id)
		end
	end,
	dict:fold(AddFolder, Dot, Funcs).

removeLastLine(Dot, Funcs) ->
	RemoveFolder = fun(Id, _) -> 
		undoFunOnDot(Dot, Id) end,
	dict:map(RemoveFolder, Funcs),
	{ok}.

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

%% --------------------------------------------------------------------
%% Utilities
%% --------------------------------------------------------------------

toKey({pair, Key, _}) -> Key;
toKey(Key) -> Key.



%% ====================================================================
%% Gen Server functions
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
handle_call(clear, _, State) ->
	rangedict:map(fun(Key, _) -> 
		gen_server:cast(self(), {removeLine, Key})	
	end, ?this(dots)),
    {reply, ok, State};
handle_call(getStateArray, _, State) ->
	SortedDict = rangedict:toSortedDict(?this(dots)),
	ResultArray = sorteddict:fold(fun(Key, Dot, Acc) -> 
		[Dot#dot.value|Acc]
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
	Dot = case rangedict:find(Key, ?this(dots)) of
		{ok, OldDot} -> OldDot#dot{num = OldDot#dot.num+1};
		error -> addFirstLine(#dot{num=1, value=Value, lines=dict:new()}, ?this(funcs))
	end,
	NewDots = rangedict:store(Key, Dot, ?this(dots)),
	NewState = State#cellState{dots=NewDots},
    {noreply, NewState};
handle_cast({removeLine, Value}, State) ->
	NewDots = case rangedict:find(Value, ?this(dots)) of
		{ok, Dot} -> 
			if 
				Dot#dot.num =< 1 ->
					removeLastLine(Dot, ?this(funcs)),
					rangedict:erase(Value, ?this(dots));
				true -> 
					rangedict:store(Value, Dot#dot{num=Dot#dot.num-1}, ?this(dots))
			end;
		error -> ?this(dots)
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
	NewDots = rangedict:map(fun(Key, Dot) -> undoFunOnDot(Dot, Id) end, ?this(dots)),
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
	NewDots = case Fun of
		undefined -> ?this(dots);
		_ -> rangedict:map(fun(Key, Dot) -> runFunOnDot(Dot, Fun, Id) end, ?this(dots))
	end,
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
	AddFirstLine = fun(Val) ->
		addFirstLine(Val, ?this(funcs))
	end,
	RemoveLastLine = fun(Val) ->
		removeLastLine(Val, ?this(funcs))
	end,
	NewDots = rangedict:setKeyRange({Start, End}, AddFirstLine, RemoveLastLine, ?this(dots)),
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
