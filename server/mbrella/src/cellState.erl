-module (cellState.erl).
-compile(export_all).

-include("../include/scaffold.hrl").

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% 
%% injectOutput :: #cellState -> #outputFunction -> #cellPointer -> #cellState
%% 

injectOutput(State, OutputFunction, OutputTo) ->
	State1 = addOutput(State, OutputFunction),
	connectOutput(State, OutputFunction, OutputTo).

%% ====================================================
%% Internal API
%% ====================================================


%% ====================================================
%% Utilities
%% ====================================================

