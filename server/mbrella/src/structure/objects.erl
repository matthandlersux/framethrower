%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : a cell is a collection of dots...
%%%
%%% -------------------------------------------------------------------
-module(objects).

-behaviour(gen_server).
-include("../../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).
-define (this(Field), State#objectsState.Field).
%% --------------------------------------------------------------------
%% External exports
%-export([inject/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%%For now, export all
-compile(export_all).


%% ====================================================
%% Types
%% ====================================================

%% 
%% Class:: dict of {PropName, PropType}
%% Props :: List (Tuple String Term)
%% 

	
%% ====================================================================
%% External functions
%% ====================================================================

start() -> 
	gen_server:start({local, ?MODULE}, ?MODULE, [], []).

stop() ->
	gen_server:call(?MODULE, stop).

%%
%% accessor :: String -> String -> Tuple Atom String -> Term
%%

accessor(_ClassName, PropName, ObjectPointer) ->
	{_, _, Props} = objectStore:lookup(getName(ObjectPointer)),
	{_, Value} = lists:keyfind(PropName, 1, Props),
	Value.

%% 
%% getName :: Object | ObjectPointer -> String
%% 		
%%		

getName({objectPointer, Name}) -> Name.

%% 
%% isObjectPointer :: Object -> Bool
%% 		
%%		

isObjectPointer({objectPointer, _}) -> true;
isObjectPointer(_) -> false.

%% 
%% makeClass :: String -> String -> ok
%% 		
%%		

makeClass(ClassType, Prop) ->
	gen_server:cast(?MODULE, {makeClass, ClassType, Prop}).

%%
%% create :: Type -> List (Tuple String a) -> ObjectPointer
%%

create(ClassType, Props) ->
	InstanceName = objectStore:getName(),
	NewObject = gen_server:call(?MODULE, {create, ClassType, InstanceName, Props}),
	%add this obj to objectStore
	objectStore:store(InstanceName, NewObject),
	%return AST object
	{objectPointer, InstanceName}.

%% 
%% getState :: Dict
%% 		
%%		

getState() ->
	gen_server:call(?MODULE, getState).

%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
    {ok, dict:new()}.

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
handle_call({create, ClassType, InstanceName, Prop}, _, Classes) ->
	Class = dict:fetch(ClassType, Classes),
	NewProp = makeReactiveProps(Prop, Class),
	NewObject = {InstanceName, ClassType, NewProp},
    {reply, NewObject, Classes};
handle_call(getState, _, Classes) ->
	{reply, Classes, Classes};	
handle_call(stop, _, Classes) ->
	{stop, normal, stopped, Classes}.



%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({makeClass, ClassType, Prop}, Classes) ->
	NewClasses = dict:store(ClassType, Prop, Classes),
    {noreply, NewClasses}.

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
terminate(_Reason, _State) ->
    ok.

%% --------------------------------------------------------------------
%% Func: code_change/3
%% Purpose: Convert process state when code is changed
%% Returns: {ok, NewState}
%% --------------------------------------------------------------------
code_change(_OldVsn, State, _Extra) ->
    {ok, State}.

%% ====================================================================
%% Internal API
%% ====================================================================

%% 
%% makeReactiveProps :: Props...
%% 		
%%		

makeReactiveProps(Props, ClassProps) ->
	lists:map(
		fun ({PropName, PropType}) ->
			case type:isReactive(PropType) of
				true ->
					{PropName, cell:makeCell(type:outerType(PropType))};
				false ->
					case lists:keyfind(PropName, 1, Props) of
						false -> throw(["No Value for Object Field", PropName]);
						{_, PropValue} -> {PropName, PropValue}
					end
			end
		end, ClassProps).
		
%% 
%% getProps :: Object -> Props
%% 		
%%		

getProps({_Name, _Class, Props}) ->
	Props.