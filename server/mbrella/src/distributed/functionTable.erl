-module (functionTable).
%% Purpose of this module is to keep a mapping from function names to AST functions
%% This will be used by the parse module

-include ("../../include/scaffold.hrl").
-export([create/0, add/2, lookup/1]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

% create:: ok
% initialize ETS table and add exported primFuncs to table
create() ->
	ets:new(functionTable, [named_table]),
	{_, Exports} = lists:keyfind(exports, 1, primFuncs:module_info()),
	lists:foreach(fun({Name, Arity}) ->
		add(atom_to_list(Name), ast:makeFunction(Name, Arity))
	end, Exports),
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
			notFound
	end.