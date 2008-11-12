%%% -------------------------------------------------------------------
%%% Author  : handler
%%% Description :
%%%
%%% Created : Sat Sep  6 09:37:33 EDT 2008
%%% -------------------------------------------------------------------
-module(process).

-behaviour(gen_server).

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).
% syntactic sugar babbbyyy
-define (ob(Field), getVal(Ob, Field)).
-define (this(Field), State#?MODULE.Field).
-define (process(Data), F1 = State#?MODULE.function, F1(Data)).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

-include ("../include/scaffold.hrl").

%% --------------------------------------------------------------------
%% External exports
-export([new/2, new/0, process/2, get/2, replace/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3, pwn/2]).


%% ====================================================================
%% External functions
%% ====================================================================

new() -> start_link(null, fun(X) -> X end).
new(Name, Fun) -> start_link(Name, Fun).
start_link(Name, Fun) ->
	case gen_server:start_link(?MODULE, {Name, Fun}, []) of
		{ok, Pid} -> Pid;
		Else -> Else
	end.
	
	% this handles [{add, Val1}, {add, Val2}, {remove, Val3}]
process(ProcId, DataList) when is_list(DataList) ->
	% maybe add a pruner here too
	lists:flatten(processData(ProcId, DataList));
process(ProcId, Data) ->
	processData(ProcId, Data).

% sometimes your process needs to know its parent box in its internal function
replace(ProcId, Fun) ->
	gen_server:cast(ProcId, {replace, Fun}).


% handle a list of messages

processData(_, []) -> [];
processData(ProcId, [H|T]) ->
	[processData(ProcId, H)|processData(ProcId, T)];
processData(ProcId, Data) when is_tuple(Data) ->
	gen_server:call(ProcId, {process, Data}).
	
% used by a box on initialization to take ownership of a process

pwn(ProcId, BoxId) ->
	gen_server:cast(ProcId, {pwn, BoxId}).
	
% used by some components if they want to control the parent box

get(ProcId, Field) ->
	gen_server:call(ProcId, {get, Field}).

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
init({Name, Fun}) ->
    {ok, #process{
				name = Name, 
				function = Fun, 
				parentBox = undefined
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
handle_call({get, Field}, _, State) ->
	{reply, getVal(State, Field), State};	
handle_call({process, Data}, _, State) ->
	% data will be messages like {add, Value}...
	% must return messages like {add, Value}...
	Reply = try ?process(Data) 
			catch
				_:_ -> ?d("some error in called function", Data), null
			end,
    {reply, Reply, State}.

%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({pwn, BoxId}, State) ->
	{noreply, mblib:recordReplace(State, parentBox, BoxId)};
handle_cast({replace, Fun}, State) ->
	{noreply, mblib:recordReplace(State, function, Fun)};
handle_cast(Msg, State) ->
    {noreply, State}.

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

getVal(Record, Element) ->
	Fields = record_info(fields, process),
	Pos = mblib:which(Element, Fields),
	element(Pos + 1, Record).