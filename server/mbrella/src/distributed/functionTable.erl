-module (functionTable).
%% Purpose of this module is to keep a mapping from function names to AST functions
%% This will be used by the parse module

-behaviour(gen_server).

-include ("../../include/scaffold.hrl").
-export([create/0, add/2, lookup/1]).

-export([start/0, stop/0]).
%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

% create:: ok
% initialize ETS table and add exported primFuncs to table
create() ->
	% ets:new(functionTable, [public, named_table]),
	start(),
	ok.

% add:: String -> AST -> ok
% Add a Name, Value pair to the table
add(Name, Value) ->
	ets:insert(functionTable, {Name, Value}),
	ok.

% lookup:: String -> AST
% Lookup a function by Name.
lookup(Name) ->
	case ets:lookup(functionTable, Name) of
		[{_, Found}] ->
			Found;
		[] -> 
			case Name of
				"mapUnit" ++ N ->
					FunctionArgs = list_to_integer(N),
					ast:makeFamilyFunction(family, mapUnit, FunctionArgs + 1 , [FunctionArgs]);
				"makeTuple" ++ N ->
					Arity = list_to_integer(N),
					ast:makeFamilyFunction(family, makeTuple, Arity, [Arity]);
				[$t,$u,$p,$l,$e,_N1,$g,$e,$t,N2] ->
					ast:makeFamilyFunction(family, tupleGet, 1, [list_to_integer([N2])]);
				MaybeAccessor ->
					case string:chr(MaybeAccessor, $:) of
						0 -> notfound;
						ColonIndex -> 
							{ClassName, [_|FieldName]} = lists:split(ColonIndex-1, MaybeAccessor),
							ast:makeFamilyFunction(objects, accessor, 1, [ClassName, FieldName])
					end
			end
	end.
	
	
	
	
%%% Gen Server is here as a hack to workaround an erlang bug with creating an ets table in a -eval script.	

start() ->
	gen_server:start({local, ?MODULE}, ?MODULE, [], []),
	ok.

stop() ->
	gen_server:call(?MODULE, stop).


%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
	%may want to change globalTable from dict to ETS table
	ets:new(functionTable, [named_table]),
	%add the primFuncs to the functionTable
	{_, PrimFuncExports} = lists:keyfind(exports, 1, primFuncs:module_info()),
	lists:foreach(fun({Name, Arity}) ->
		add(atom_to_list(Name), ast:makeFunction(primFuncs, Name, Arity))
	end, PrimFuncExports),
	
	%add the action functions to the functionTable
	{_, ActionExports} = lists:keyfind(exports, 1, actions:module_info()),
	lists:foreach(fun({Name, Arity}) ->
		add(atom_to_list(Name), ast:makeFunction(actions, Name, Arity))
	end, ActionExports),
	
    {ok, nostate}.

handle_call(stop, _, State) ->
	{stop, normal, stopped, State}.

handle_cast(_, State) ->
    {noreply, State}.

handle_info(_, State) -> {noreply, State}.
terminate(_, _) -> ok.
code_change(_, State, _) -> {ok, State}.