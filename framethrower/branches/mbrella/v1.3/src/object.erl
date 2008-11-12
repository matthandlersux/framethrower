%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Sep 1, 2008
%%% -------------------------------------------------------------------
-module(object).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
-define (ob(Field), mblib:getVal(State, Field)).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

-include ("../include/scaffold.hrl").

%% --------------------------------------------------------------------
%% External exports
-export([new/1, start_link/1, get/2, control/3, die/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%% ====================================================================
%% External functions
%% ====================================================================

new(Type) -> start_link(Type).
start_link(Type) ->
	case gen_server:start_link(?MODULE, [Type, self()], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.

get(ObPid, Field) ->
	gen_server:call(ObPid, {get, Field}).

%% 
%% possibly use interface:setAdd(Val) -> {add, Val} to abstract out the control messages
%% 
control(ObPid, Field, ControlMsg) ->
	gen_server:cast(ObPid, {control, Field, ControlMsg}).
	
die(ObPid, Reason) ->
	gen_server:cast(ObPid, {terminate, Reason}).


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
init([Type, Parent]) ->
	process_flag(trap_exit, true),
    {ok, #ob{
		type = Type,
		parentSituation = Parent,
		involves = startcap:new(interface:new(set, infon)),
		corresponds = startcap:new(interface:new(set, ob)),
		childObjects = startcap:new(interface:new(set, ob)),
		properties = [],
		content = startcap:new(interface:new(unit, xml))
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
handle_call({get, Field}, _From, State) ->
    Reply = ?ob(Field),
    {reply, Reply, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({control, Field, ControlMsg}, State) ->
	case ?ob(Field) of
		Pid when is_pid(Pid) ->
			startcap:control(Pid, ControlMsg),
			{noreply, State};
		InternalData ->
			NewField = control(InternalData, ControlMsg),
			{noreply, mblib:recordReplace(State, Field, NewField)}
	end;
handle_cast({terminate, Reason}, State) ->
	{stop, Reason, State}.

%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info({'EXIT', From, Reason}, State) ->
	nyi,
	{noreply, State};
handle_info({terminate, Reason}, State) ->
	{stop, Reason, State};
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

control(_, {set, Val}) ->
	Val;
control(Old, {add, Val}) ->
	Old ++ [Val];
control(Old, {remove, Val}) ->
	Old -- [Val].