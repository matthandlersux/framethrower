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
% heard from (for checking when done on multiple informants)
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

new(CellType) ->
	-record (cellState, {
		options = [],
		intercept = intercepts:standard(),
		done = [],
		cellElements:new(CellType),
		stash = [],
		outputs = outputs:newState(),
		flags = [],
		informants = []
	}).

%% 
%% injectOutput :: CellState -> OutputFunction -> CellPointer -> CellState
%% 

injectOutput(State, OutputFunction, OutputTo) ->
	%%%% TODO when there are a lot of outputs, switch from a list to a dict
	Outputs = State#cellState.outputs,
	State#cellState{outputs = outputs:addOutput(OutputFunction, OutputTo, Outputs)}.

%% 
%% injectIntercept :: #cellState -> #interceptObject -> #cellState
%% 

injectIntercept(State, {_FunctionName, _InterceptState, _Args} = InterceptPointer) ->
	replace(State, intercept, InterceptPointer).
	


%% 
%% getElements :: CellState -> CellElements
%%		used to pass the elements data structure to outputs incase they want to run functions on the whole set
%% 

getElements(State) ->
	
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