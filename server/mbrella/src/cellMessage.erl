-module (cellMessage.erl).
-compile(export_all).

-include().

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

fromName({_AddRemove, CellPointer, _Message}) ->
	cellPointer:name(CellPointer).
	
toElement({Modifier, _CellPointer, Message}) ->
	{Modifier, Message}.

%% ====================================================
%% Internal API
%% ====================================================


%% ====================================================
%% Utilities
%% ====================================================

