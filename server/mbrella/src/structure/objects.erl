%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : a cell is a collection of dots...
%%%
%%% -------------------------------------------------------------------
-module(objects).

-behaviour(gen_server).
-include("../../include/scaffold.hrl").
-include ("../../include/ast.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#objectsState.Field).
%% --------------------------------------------------------------------
%% External exports
%-export([inject/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%%For now, export all
-compile(export_all).


%% ====================================================================
%% internal data structure records
%% ====================================================================
-record(objectsState, {classes=dict:new()}).
-record(class, {name, prop=dict:new(),inherit,memoize,memoTable=dict:new(),castUp,castDown,makeMemoEntry}).
-record(memoEntry, {broadcaster, object}).

%% ====================================================
%% Types
%% ====================================================

%% 
%% Value:: Nat | Bool | String | Cell | {Value, Value}
%% Cell:: Pid
%% Pid:: < Nat . Nat . Nat >
%% 

	
%% ====================================================================
%% External functions
%% ====================================================================

start() -> 
	gen_server:start({local, ?MODULE}, ?MODULE, [], []).

stop() ->
	gen_server:call(?MODULE, stop).


accessor(ClassName, PropName, ObjectName) ->
	objectStore:getField(ObjectName, PropName).


makeClasses(ClassesToMake) ->
	lists:map(fun (ClassDef) ->
		#classToMake{name = Name, prop = Prop} = ClassDef,
		makeClass(Name, Prop)
	end, ClassesToMake).

makeClass(Name, Prop) ->
	gen_server:cast(?MODULE, {makeClass, Name, Prop}).

create(ClassName, InstanceName, Props) ->
	#object{name = ObjectName} = NewObject = gen_server:call(?MODULE, {create, ClassName, InstanceName, Props}),
	%add this obj to objectStore
	objectStore:store(ObjectName, NewObject),
	%return AST object
	ast:makeObject(ObjectName).

getState() ->
	gen_server:call(?MODULE, getState).

%% ====================================================================
%% Internal functions
%% ====================================================================
makeReactiveProps(Props, Class) ->
	dict:map(
		fun (PropName, PropType) ->
			case type:isReactive(PropType) of
				true ->
					cell:makeCell(type:outerType(PropType));
				false ->
					dict:fetch(PropName, Props)
			end
		end, Class#class.prop).


%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
    {ok, #objectsState{}}.

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
handle_call({create, ClassName, InstanceName, Prop}, _, State) ->
	Classes = ?this(classes),
	Class = dict:fetch(ClassName, Classes),
	ObjectName = objectStore:getName(),
	Type = #type{type=typeName, value=list_to_atom(ClassName)},
	NewProp = makeReactiveProps(Prop, Class),
	NewObject = {name = ObjectName, type = Type, prop = NewProp},
    {reply, NewObject, State};
handle_call(getState, _, State) ->
	{reply, State, State};	
handle_call(stop, _, State) ->
	{stop, normal, stopped, State}.



%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({makeClass, Name, Prop}, State) ->
	Classes = ?this(classes),
	NewClass = #class{
		name = Name,
		prop = Prop
	},
	NewClasses = dict:store(Name, NewClass, Classes),
	NewState = #objectsState{classes=NewClasses},
    {noreply, NewState}.

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