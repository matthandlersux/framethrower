-module (cellState.erl).
-compile(export_all).

-include("../include/scaffold.hrl").

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% notes
%% ====================================================

% options = [{output_before_done, true}, ...],
% intercept = {invert, [CellPointer1, CellPointer2], {last_message, X}},
% elements = ___,
% stash = ___,
% outputs = [{[CellPointer1, ...], {takeOne, [Arg1, Arg2]}, {one_taken, X}}, ...]
% flags = [{name, true|false}, ...]
% informants = [CellPointer1, CellPointer2, ...]

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

new() ->
	.

%% 
%% injectOutput :: #cellState -> #outputFunction -> #cellPointer -> #cellState
%% 

injectOutput(State, OutputFunction, OutputTo) ->
	State1 = addOutput(State, OutputFunction),
	connectOutput(State, OutputFunction, OutputTo).

%% 
%% injectIntercept :: #cellState -> #interceptObject -> #cellState
%% 

injectIntercept(State, {_FunctionName, _InterceptState, _Args} = InterceptPointer) ->
	replace(State, intercept, InterceptPointer).
	


	
getElements(State) ->
	%unpack elements so that they are {add, Element} without the weighting
	.
	
getOutputs(State) ->
	%return list of outputs like [{}]
	.
	
cellPointer(State) ->
	.
	
updateOutputStates(OutputStates, State) ->
	.
	
getFlag(State, Flag) ->
	.

%% 
%% updateStash :: CellState -> List Element -> List Element
%%		takes stash, merges with new elements, returns all elements (called when done)
%% 

updateStash(State, Elements) ->
	.
	
%% 
%% mergeStash :: CellState -> List Element -> CellState
%% 		stores elements that have been processed by the intercept but aren't ready to move because the 
%%		cell is waiting to be done
%% 

mergeStash(State, Elements) ->
	.

%% ====================================================
%% Internal API
%% ====================================================




	
%% ====================================================
%% Utilities
%% ====================================================

state(State, Field) ->
	State#cellState.Field.
	
replace(State, Field, NewField) ->
	%erlang may not allow this
	State#cellState{Field = NewField}.