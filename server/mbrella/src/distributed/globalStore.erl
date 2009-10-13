-module (globalStore).

-behaviour(gen_server).
-import(mblib, [curry/1]).
-include ("../../include/scaffold.hrl").
-export([start/0, stop/0, nameAndStoreCell/1, nameAndStoreObj/1, store/2, lookup/1, lookupPointer/1, addFun/3, getState/0, getStateDict/0, createEnv/0]).
%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3, getPrimitives/0]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#globalStoreState.Field).

-record (globalStoreState, {
	nameCounter,
	globalTable,
	baseEnv
}).

start() ->
	gen_server:start({local, ?MODULE}, ?MODULE, [], []),
	FuncExprs = [
		{"compose", "(\\ (\\ (\\ (/3 (/2 /1)))))"},
		% {"compose", "f -> g -> y -> f (g y)"},
		{"swap", "(\\ (\\ (\\ ((/3 /1) /2))))"}
		% {"swap", "f -> x -> y -> f y x"}
	],
	lists:map(fun ({Name, ExprString}) -> addExpr(Name, expr:exprParse(ExprString)) end, FuncExprs),
	ok.

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

getStateDict() ->
	gen_server:call(?MODULE, getStateDict).

lookup(Name) ->
	gen_server:call(?MODULE, {lookup, Name}).

lookupPointer(ParsedString) ->
	case lookup(ParsedString) of
		notfound -> notfound;
		ExprCell when is_record(ExprCell, exprCell) -> 
			#cellPointer{name = ParsedString, pid = ExprCell#exprCell.pid};
		Object when is_record(Object, object) -> 
			#objectPointer{name = ParsedString};
		ExprFun when is_record(ExprFun, exprFun) ->
			#funPointer{name = ParsedString};
		{exprLib, Expr} -> Expr
	end.

addFun(Name, Type, Function) ->
	gen_server:cast(?MODULE, {addFun, Name, Type, Function}).

addExpr(Name, Expr) ->
	gen_server:cast(?MODULE, {addExpr, Name, Expr}).


getPrimitives() ->
	BuildEnv = fun(#exprFun{function = Func, type = TypeString, name = Name} = Expr, {Suffix, Dict}) ->
			{Suffix + 1, dict:store(Name, Expr#exprFun{function=curry(Func),type = type:shiftVars( type:parse(TypeString), integer_to_list(Suffix) ++ "v")}, Dict)}
		end,
	FunList = primFuncs:primitives(),
	{_, FinalDict} = lists:foldl( BuildEnv, {1, dict:new()}, FunList),
	FinalDict.

createEnv() ->
	getPrimitives().
	
%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
	%may want to change globalTable from dict to ETS table
    {ok, #globalStoreState{nameCounter = 0, globalTable = ets:new(env, []), baseEnv = createEnv()}}.

handle_call({nameAndStoreCell, ExprCell}, _, State) ->
	NewNameCounter = ?this(nameCounter) + 1,
	Name = "server." ++ integer_to_list(NewNameCounter),
	NewExprCell = ExprCell#exprCell{name=Name},
	ets:insert(?this(globalTable), {Name, NewExprCell}),
    {reply, NewExprCell, State#globalStoreState{nameCounter = NewNameCounter}};
handle_call({nameAndStoreObj, Obj}, _, State) ->
	NewNameCounter = ?this(nameCounter) + 1,
	Name = "server." ++ integer_to_list(NewNameCounter),
	NewObj = Obj#object{name=Name},
	ets:insert(?this(globalTable), {Name, NewObj}),
    {reply, NewObj, State#globalStoreState{nameCounter = NewNameCounter}};
handle_call({lookup, Name}, _, State) ->
	BaseCell = dict:find(Name, ?this(baseEnv)),
	GlobalCell = case BaseCell of
		error -> 
			case ets:lookup(?this(globalTable), Name) of
				[{_, Reply}] ->
					Reply;
				[] -> 
					notfound
			end;
		{ok, Answer} -> Answer
	end,
    {reply, GlobalCell, State};
handle_call(getStateDict, _, State) ->
    {reply, ?this(globalTable), State};
handle_call(getState, _, State) ->
    {reply, State, State};
handle_call(stop, _, State) ->
	{stop, normal, stopped, State}.




handle_cast({addFun, Name, TypeString, Function}, State) -> 
	Type = type:parse(TypeString),
	NewExprFun = #exprFun{name = Name, type = Type, function = Function},
	ets:insert(?this(globalTable), {Name, NewExprFun}),
	{noreply, State};
handle_cast({addExpr, Name, Expr}, State) -> 
	ets:insert(?this(globalTable), {Name, Expr}),
	{noreply, State};
handle_cast({store, Name, Obj}, State) ->
	ets:insert(?this(globalTable), {Name, Obj}),
    {noreply, State}.


handle_info(_, State) -> {noreply, State}.
terminate(_, _) -> ok.
code_change(_, State, _) -> {ok, State}.