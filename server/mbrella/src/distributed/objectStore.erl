-module (objectStore).

-behaviour(gen_server).
-include ("../../include/scaffold.hrl").
-export([start/0, stop/0, getName/0, store/2, lookup/1, getState/0, getStateDict/0, fold/2, setCounter/1]).
%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#objectStoreState.Field).

-record (objectStoreState, {
  nameCounter,
  globalTable
}).

start() ->
  gen_server:start({local, ?MODULE}, ?MODULE, [], []),
  ok.

stop() ->
  gen_server:call(?MODULE, stop).

getName() ->
  gen_server:call(?MODULE, getName).

setCounter(Num) ->
  gen_server:cast(?MODULE, {setCounter, Num}).

store(Name, Obj) ->
  gen_server:cast(?MODULE, {store, Name, Obj}).

getState() ->
  gen_server:call(?MODULE, getState).

getStateDict() ->
  gen_server:call(?MODULE, getStateDict).

lookup(Name) ->
  gen_server:call(?MODULE, {lookup, Name}).

fold(Fun, Acc) ->
  gen_server:cast(?MODULE, {fold, Fun, Acc}).

%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
  process_flag(trap_exit, true),
  %may want to change globalTable from dict to ETS table
    {ok, #objectStoreState{nameCounter = 0, globalTable = ets:new(objectStore, [named_table])}}.

handle_call(getName, _, State) ->
  NewNameCounter = ?this(nameCounter) + 1,
  Name = "object." ++ integer_to_list(NewNameCounter),
    {reply, Name, State#objectStoreState{nameCounter = NewNameCounter}};
handle_call({lookup, Name}, _, State) ->
  Object = case ets:lookup(?this(globalTable), Name) of
    [{_, Reply}] ->
      Reply;
    [] ->
      notfound
  end,
    {reply, Object, State};
handle_call(getStateDict, _, State) ->
    {reply, ?this(globalTable), State};
handle_call(getState, _, State) ->
    {reply, State, State};
handle_call(stop, _, State) ->
  {stop, normal, stopped, State}.

handle_cast({setCounter, Num}, State) ->
  {noreply, State#objectStoreState{nameCounter = Num}};
handle_cast({fold, Fun, Acc}, State) ->
  ets:foldl(Fun, Acc, ?this(globalTable)),
  {noreply, State};
handle_cast({store, Name, Cell}, State) ->
  ets:insert(?this(globalTable), {Name, Cell}),
    {noreply, State}.


handle_info(_, State) -> {noreply, State}.
terminate(_, _) -> ok.
code_change(_, State, _) -> {ok, State}.