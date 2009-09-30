-module (cellState).
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

% name = string
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

-record (cellState, {
	name,
	options = [],
	intercept = undefined, %intercepts:standard(),
	done = [],
	elements = cellElements:new(),
	stash = [],
	outputs = outputs:newState(),
	flags = [],
	informants = []
}).

%% ====================================================
%% External API
%% ====================================================

new(CellType) ->
	#cellState{elements = cellElements:new(CellType)}.

%% 
%% injectOutput :: CellState -> OutputFunction -> CellPointer -> CellState
%% 

injectOutput(State, OutputFunction, OutputTo) ->
	%%%% TODO when there are a lot of outputs, switch from a list to a dict
	Outputs = State#cellState.outputs,
	State#cellState{outputs = outputs:addOutput(OutputFunction, OutputTo, Outputs)}.

%% 
%% injectIntercept :: CellState -> Intercept -> CellState
%% 

injectIntercept(State, Intercept) ->
	State#cellState{intercept = Intercept}.
	
%% 
%% getElements :: CellState -> CellElements
%%		used to pass the elements data structure to outputs incase they want to run functions on the whole set
%% 

getElements(#cellState{elements = CellElements} = State) -> CellElements.

%% 
%% getOutputs :: CellState -> List Output
%% 

getOutputs(#cellState{outputs = Outputs} = State) ->
	outputs:toList(Outputs).

%% 
%% cellPointer :: CellState -> CellPointer
%% 

cellPointer(#cellState{name = Name} = State) ->
	cellPointer:create(Name, self()).

%% 
%% updateOutputStates :: List OutputStates -> CellState -> CellState
%%  	needs to be in the same order as the outputs are in getOutputs
%% 

updateOutputStates(OutputStates, #cellState{outputs = Outputs} = State) ->
	State#cellState{outputs = outputs:updateOutputStates(OutputStates, Outputs)}.

%% 
%% getFlag :: CellState -> Atom -> Bool
%% 

getFlag(#cellState{flags = Flags} = State, Flag) ->
	case lists:keyfind(Flag, 1, Flags) of
		false -> false;
		{Flag, Value} -> Value
	end.

%% 
%% updateStash :: CellState -> List Element -> List Element
%%		takes stash, merges with new elements, returns all elements (called when done)
%% 

updateStash(#cellState{stash = Stash} = State, Elements) ->
	%ordering is very important here
	todo.
	
%% 
%% mergeStash :: CellState -> List Element -> CellState
%% 		stores elements that have been processed by the intercept but aren't ready to move because the 
%%		cell is waiting to be done
%% 

mergeStash(#cellState{stash = Stash} = State, Elements) ->
	todo.

%% ====================================================
%% Internal API
%% ====================================================




	
%% ====================================================
%% Utilities
%% ====================================================

% state(State, Field) ->
% 	State#cellState.Field.
% 	
% replace(State, Field, NewField) ->
% 	%erlang may not allow this
% 	State#cellState{Field = NewField}.