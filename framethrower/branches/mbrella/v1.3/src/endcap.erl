%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description : a endcap is a startcap bound to a process with a nondestructive output interface
%%%
%%% Created : Fri Sep 19 14:03:39 EDT 2008
%%% -------------------------------------------------------------------
-module(endcap).

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
-export([new/0, new/1, new/2, start_link/2, start_link/1, data/2, die/2, connect/2, disconnect/2, control/2, ambient/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%% ====================================================================
%% External functions
%% ====================================================================

new() -> start_link( process:new() ).
new(Process) -> start_link(Process).
start_link(Process) ->
	case gen_server:start_link(?MODULE, [Process], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.

new(Process, OutputType) -> start_link(Process, OutputType).
start_link(Process, OutputType) -> 
	case gen_server:start_link(?MODULE, [Process, OutputType], []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.
	
data(BoxId, Data) ->
	gen_server:cast(BoxId, {data, Data}).
	
connect(BoxId, Pid) ->
	gen_server:cast(BoxId, {connect, Pid}).

disconnect(BoxId, Pid) ->
	gen_server:cast(BoxId, {disconnect, Pid}).
	
control(BoxId, Data) ->
	gen_server:cast(BoxId, {control, Data}).
	
ambient(BoxId, Link) ->
	gen_server:cast(BoxId, {ambient, Link}).

% control(BoxId, Data) ->
% 	gen_server:cast(BoxId, {control, Data}).

die([], _) ->
	[];
die([BoxId|T], Reason) ->
	die(BoxId, Reason),
	die(T, Reason);
die(BoxId, Reason) ->
	gen_server:cast(BoxId, {terminate, Reason}).


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
init([Process, Type]) ->
	process_flag(trap_exit, true),
	Self = self(),
	process:pwn(Process, Self),
	if
		Type =:= endcap -> Startcap = startcap:new(interface:new(Type, cleanup));
		true -> Startcap = startcap:new(interface:new(Type, endcap))
	end,
    {ok, #endcap{
		type = Type,
		process = Process,
		startcap = Startcap,
		crossReference = crossreference:new()
	}};
init([Process]) ->
	process_flag(trap_exit, true),
	Self = self(),
	process:pwn(Process, Self),
    {ok, #endcap{
		type = bag,
		process = Process,
		startcap = startcap:new(interface:new(bag, endcap)),
		crossReference = crossreference:new()
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
handle_cast({data, Data}, State) ->
	Data1 = process:process(?this(process), Data),
	case Data1 of
		null -> %the process will control the startcap manually for reactivity
			{noreply, State};
		{null, CleanupFun} when ?this(type) =:= unit ->
			CrossReference = crossreference:control(?this(crossReference), {Data, CleanupFun}),
			{noreply, State#endcap{crossReference = CrossReference}};			
		{null, CleanupFun} -> %the process controls the startcap but returns cleanup functions for removal of that input
			CrossReference = crossreference:control(?this(crossReference), {Data, CleanupFun}),
			{noreply, State#endcap{crossReference = CrossReference}};
		_ ->
			startcap:control(?this(startcap), Data1),
			{noreply, State}
	end;
handle_cast({connect, Pid}, State) ->
	startcap:connect(?this(startcap), Pid),
    {noreply, State};
handle_cast({disconnect, Pid}, State) ->
	startcap:disconnect(?this(startcap), Pid),
	{noreply, State};
handle_cast({control, Data}, State) ->
	startcap:control(?this(startcap), Data),
	{noreply, State};
handle_cast({ambient, Link}, State) ->
	link(Link),
	{noreply, State};
% handle_cast({control, Data}, State) ->
% 	Interface = interface:control(?this(type), Data, ?this(interface)),
% 	pin:data(?this(outputPin), Data),
% 	{noreply, State#startcap{interface = Interface}};
handle_cast({terminate, Reason}, State) ->
	% process:die(?this(process), "Terminated"),
	startcap:die(?this(startcap), "Terminated"),
	{stop, Reason, State}.

%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info({data, Data}, State) ->
	handle_cast({data, Data}, State),
    {noreply, State};
handle_info({get, state}, State) ->
	{reply, State, State}.

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