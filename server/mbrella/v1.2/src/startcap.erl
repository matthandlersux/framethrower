%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Wed Sep  3 16:37:08 EDT 2008
%%% -------------------------------------------------------------------
-module(startcap).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
-define (ob(Field), mblib:getVal(Ob, Field)).
-define (this(Field), State#?MODULE.Field).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------
-include ("../include/scaffold.hrl").
%% --------------------------------------------------------------------
%% External exports
-export([new/1, start_link/1, connect/2, disconnect/2, control/2, die/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).
	
%% ====================================================================
%% External functions
%% ====================================================================

new(Interface) -> start_link(Interface).
start_link(Interface) ->
	case gen_server:start_link(?MODULE, [self(), Interface], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.
	
connect(StartcapPid, Pid) ->
	gen_server:cast(StartcapPid, {connect, Pid}).

disconnect(StartcapPid, Pid) ->
	gen_server:cast(StartcapPid, {disconnect, Pid}).

control(_, {nodata}) ->
	nodata;
control(StartcapPid, Data) ->
	gen_server:cast(StartcapPid, {control, Data}).

die(CacheId, Reason) ->
	gen_server:cast(CacheId, {terminate, Reason}).


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
init([Parent, Interface]) ->
	process_flag(trap_exit, true),
	OutputPin = pin:new(),
	link(OutputPin),
    {ok, #startcap{
		type = Interface#interface.type,
		subType = Interface#interface.subType,
		parentObject = Parent,
		outputPin = OutputPin,
		interface = Interface
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
handle_call(Msg, From, State) ->
    Reply = ok,
    {reply, Reply, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({connect, Pid}, State) ->
	pin:connect(?this(outputPin), Pid),
	pin:data(?this(outputPin), interface:dataList(?this(interface))),
    {noreply, State};
handle_cast({disconnect, Pid}, State) ->
	pin:disconnect(?this(outputPin), Pid),
	{noreply, State};
handle_cast({control, Data}, State) ->
	Interface = interface:control(?this(type), Data, ?this(interface)),
	pin:data(?this(outputPin), Data),
	{noreply, State#startcap{interface = Interface}};
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
	if
		From =:= ?this(outputPin) ->
			unlink(?this(outputPin)),
			NewPin = pin:new(),
			link(NewPin),
			{noreply, State#startcap{outputPin = NewPin}};
		true ->
			{noreply, State}
	end;
handle_info(Info, State) ->
    {noreply, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(Reason, State) ->
	pin:die(?this(outputPin), pin_terminating),
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