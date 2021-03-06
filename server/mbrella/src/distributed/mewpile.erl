%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Fri Oct 16 15:06:53 EDT 2009
%%% -------------------------------------------------------------------
-module(mewpile).

-behaviour(gen_server).

-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

%% --------------------------------------------------------------------
%% External exports
-export([mewpilate/1, new/0, store/2, remove/1, get/1, debug/0, reset/0]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).


%% ====================================================================
%% External functions
%% ====================================================================

%%
%% new :: Pid
%%
%%

new() -> start().
start() ->
  case gen_server:start({local, ?MODULE}, ?MODULE, [], []) of
    {ok, Pid} -> Pid;
    Else -> Else
  end.

%%
%% store :: AST -> AST -> ok
%%
%%

store(AST, CellAST) ->
  gen_server:cast(?MODULE, {store, AST, CellAST}).

%%
%% remove :: AST -> AST -> ok
%%
%%

remove([]) ->
  ok;
remove(AST) ->
  gen_server:cast(?MODULE, {remove, AST}).

%%
%% get :: AST -> CellPointer
%%
%%

get(AST) ->
  gen_server:call(?MODULE, {get, AST}).

%%
%% mewpilate :: AST -> NormalizedAST
%%
%%

mewpilate([]) -> [];
mewpilate([H|T]) ->
  [mewpilate(H)|mewpilate(T)];
mewpilate(AST) ->
  mewpilate(ast:type(AST), AST).

%%
%% debug :: List CellAST
%%
%%

debug() ->
  gen_server:call(?MODULE, debug).

%%
%% reset :: ok
%%
%%

reset() ->
  gen_server:cast(?MODULE, reset).

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
init(_) ->
    {ok, ets:new(mewpile, [named_table])}.

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
handle_call(debug, _, ETS) ->
  TableList = ets:tab2list(ETS),
  Unparse = fun({AST, {cell,{{CellName,_},_}}}) ->
        try io:format("\033[96m~p\033[0m~n~p~n~n", [parse:unparse(AST), CellName] )
        catch
          _:_ -> io:format("\033[96m~p\033[0m~n~p~n~n", [AST, CellName] )
        end
      end,
  {reply, lists:foreach(Unparse, TableList), ETS};
handle_call({get, AST}, _From, ETS) ->
  NormalizedAST = mewpilate(AST),
  Reply =   case ets:lookup(ETS, NormalizedAST) of
          [{_, CellAST}] ->
            CellAST;
          [] ->
            false
        end,
    {reply, Reply, ETS}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({store, AST, CellAST}, ETS) ->
  NormalizedAST = mewpilate(AST),
  cell:setBottom(ast:toTerm(CellAST), NormalizedAST),
  ets:insert(ETS, {NormalizedAST, CellAST}),
    {noreply, ETS};
handle_cast({remove, AST}, ETS) ->
  ets:delete(ETS, AST),
    {noreply, ETS};
handle_cast(reset, ETS) ->
  ets:delete_all_objects(ETS),
  {noreply, ETS}.

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

%%
%% mewpilate :: Atom -> AST -> NormalizedAST
%%
%%

mewpilate(lambda, AST) ->
  ast:makeLambda(
    mewpilate( ast:getLambdaAST(AST) ),
    ast:getArity(AST)
  );
mewpilate(apply, AST) ->
  ast:makeApply(
    mewpilate( ast:getApplyFunction(AST) ),
    mewpilate( ast:getApplyParameters(AST) )
  );
mewpilate(tuple, AST) ->
  ast:makeTuple(
    list_to_tuple( mewpilate( tuple_to_list( ast:getTuple(AST) ) ) )
  );
mewpilate(cell, AST) ->
  ast:makeCell(
    ast:getCellName(AST),
    undefined
  );
mewpilate(_, AST) ->
  AST.