-module (env).

-behaviour(gen_server).
-import(mblib, [curry/1]).
-include ("../include/scaffold.hrl").
-export([start/0, stop/0, nameAndStoreCell/1, nameAndStoreObj/1, store/2, lookup/1, addFun/3, getState/0]).
%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).


-record (envState, {
	nameCounter,
	globalTable,
	globalTableByPid,
	baseEnv
}).

start() ->
	gen_server:start({local, ?MODULE}, ?MODULE, [], []).

stop() ->
	gen_server:call(?MODULE, stop).

nameAndStoreCell(CellExpr) ->
	gen_server:call(?MODULE, {nameAndStoreCell, CellExpr}).

nameAndStoreObj(Obj) ->
	gen_server:call(?MODULE, {nameAndStoreObj, Obj}).

store(Name, Obj) ->
	gen_server:cast(?MODULE, {store, Name, Obj}).

getState() ->
	gen_server:call(?MODULE, getState).

	
lookup(Pid) when is_pid(Pid) ->
	gen_server:call(?MODULE, {lookupPid, Pid});
lookup(Name) ->
	gen_server:call(?MODULE, {lookup, Name}).

addFun(Name, Type, Function) ->
	gen_server:cast(?MODULE, {addFun, Name, Type, Function}).

getPrimitives() ->
	BuildEnv = fun(#exprFun{function = Func, type = TypeString, name = Name} = Expr, {Suffix, Dict}) ->
			{Suffix + 1, dict:store(Name, Expr#exprFun{function=curry(Func),type = type:shiftVars( type:parse(TypeString), integer_to_list(Suffix) ++ "v")}, Dict)}
		end,
	% BuildEnv = fun({Name, TypeString, Fun}, {Suffix, Dict}) ->
	% 				{Suffix + 1, dict:store(Name, {type:shiftVars( type:parse(TypeString), integer_to_list(Suffix) ++ "v"), Fun}, Dict)}
	% 			end,
	FunList = primFuncs:primitives(),
	{_, FinalDict} = lists:foldl( BuildEnv, {1, dict:new()}, FunList),
	FinalDict.

createEnv() ->
	PrimEnv = getPrimitives(),
	FuncExprs = [
		%can't add these here because expr:expr needs to call env. 
		%These will need to be expr:expr externally and then added to the environment.	
		% {"plus1", "x -> add x 1"},
		% {"plus2", "n -> add n 1"},
		% {"compose", "f -> g -> y -> f (g y)"}
	],
	DefaultEnv = lists:foldl(fun addExpr/2, PrimEnv, FuncExprs).

addExpr({Name, ExprString}, Env) ->
	dict:store(Name, expr:exprParse(ExprString), Env).	

	
%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
	%may want to change globalTable from dict to ETS table
    {ok, #envState{nameCounter = 0, globalTable = dict:new(), globalTableByPid = dict:new(), baseEnv = createEnv()}}.

handle_call({nameAndStoreCell, ExprCell}, From, State) ->
	#envState{nameCounter = NameCounter, globalTable = GlobalTable, globalTableByPid = GlobalPidTable} = State,
	NewNameCounter = NameCounter + 1,
	Name = "server." ++ integer_to_list(NewNameCounter),
	NewExprCell = ExprCell#exprCell{name=Name},
	NewGlobalTable = dict:store(Name, NewExprCell, GlobalTable),
	%hack for name lookups
	Pid = ExprCell#exprCell.pid,
	NewGlobalPidTable = dict:store(Pid, NewExprCell, GlobalPidTable),
	NewState = State#envState{nameCounter = NewNameCounter, globalTable = NewGlobalTable, globalTableByPid = NewGlobalPidTable},
    {reply, NewExprCell, NewState};
handle_call({nameAndStoreObj, Obj}, From, State) ->
	#envState{nameCounter = NameCounter, globalTable = GlobalTable} = State,
	NewNameCounter = NameCounter + 1,
	Name = "server." ++ integer_to_list(NewNameCounter),
	NewObj = Obj#object{name=Name},
	NewGlobalTable = dict:store(Name, NewObj, GlobalTable),
	NewState = State#envState{nameCounter = NewNameCounter, globalTable = NewGlobalTable},
    {reply, NewObj, NewState};
handle_call({lookup, Name}, From, State) ->
	#envState{globalTable = GlobalTable, baseEnv = BaseEnv} = State,
	ExprCell = 
		try dict:fetch(Name, GlobalTable)
		catch
			_:_ -> 
				try dict:fetch(Name, BaseEnv)
				catch
					_:_ -> notfound
				end
		end,
    {reply, ExprCell, State};
handle_call({lookupPid, Pid}, From, State) ->
	#envState{globalTableByPid = GlobalTable, baseEnv = BaseEnv} = State,
	ExprCell = 
				try dict:fetch(Pid, GlobalTable)
				catch
					_:_ -> notfound
				end,
    {reply, ExprCell, State};
handle_call(getState, From, State) ->
    {reply, State, State};
handle_call(stop, From, State) ->
	{stop, normal, stopped, State}.




handle_cast({addFun, Name, TypeString, Function}, State) -> 
	#envState{globalTable = GlobalTable, globalTableByPid = GlobalPidTable} = State,
	Type = type:parse(TypeString),
	NewExprFun = #exprFun{name=Name, type=Type, function=Function},
	NewGlobalTable = dict:store(Name, NewExprFun, GlobalTable),
	NewState = State#envState{globalTable = NewGlobalTable},
	{noreply, NewState};
handle_cast({store, Name, Obj}, State) ->
	#envState{globalTable = GlobalTable} = State,
	NewGlobalTable = dict:store(Name, Obj, GlobalTable),
	NewState = State#envState{globalTable = NewGlobalTable},
    {noreply, NewState}.


handle_info(_, State) -> {noreply, State}.
terminate(Reason, State) -> ok.
code_change(OldVsn, State, Extra) -> {ok, State}.