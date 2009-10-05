-module (cellState).
-compile(export_all).

-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).

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
	done = false,
	elements = cellElements:new(),
	stash = [],
	outputs = outputs:newState(),
	flags = [{leashed, false}, {waitForDone, false}],
	informants = []
}).

%% ====================================================
%% External API
%% ====================================================

new(CellType) ->
	#cellState{elements = cellElements:new(CellType)}.

new(CellType, Flags) ->
	processFlags(#cellState{elements = cellElements:new(CellType)}, Flags).
	
%% 
%% injectOutput :: CellState -> OutputFunction -> CellPointer -> CellState
%% 

injectOutput(#cellState{outputs = Outputs} = State, OutputNameOrFunction, OutputTo) ->
	%%%% TODO when there are a lot of outputs, switch from a list to a dict
	State#cellState{outputs = outputs:addOutput(OutputNameOrFunction, OutputTo, Outputs)}.

%% 
%% injectIntercept :: CellState -> Intercept -> CellState
%% 

injectIntercept(State, Intercept) ->
	State#cellState{intercept = Intercept}.

%% 
%% updateInformants :: CellState -> List CellPointers -> CellState
%% 

updateInformants(State, InformantsList) ->
	Informants = lists:map(fun(CellPointer) -> {CellPointer, false} end, InformantsList),
	State#cellState{informants = Informants}.

%% 
%% setDone :: CellState -> CellPointer -> CellState
%% 

setDone(#cellState{informants = Informants, done = Done} = State, CellPointer) ->
	if
		Done -> State;
		true ->
			FindCellPointer = 	fun({CellPointerFromList, IsDone}, IsTotalDone) ->
									if 
										IsDone andalso IsTotalDone ->
											{{CellPointerFromList, IsDone}, true};
										IsDone andalso (not IsTotalDone) ->
											{{CellPointerFromList, IsDone}, false};
										CellPointer =:= CellPointerFromList ->
											{{CellPointerFromList, true}, IsTotalDone};
										not IsDone ->
											{{CellPointerFromList, IsDone}, false};
										true ->
											{{CellPointerFromList, IsDone}, IsDone}
									end
								end,
			{NewInformants, Done1} = lists:mapfoldl(FindCellPointer, true, Informants),
			State#cellState{informants = NewInformants, done = Done1}
	end.
	
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
%% getIntercept :: CellState -> Intercept
%% 

getIntercept(#cellState{intercept = Intercept} = State) ->
	Intercept.

%% 
%% updateOutputStates :: List OutputStates -> CellState -> CellState
%%  	needs to be in the same order as the outputs are in getOutputs
%% 

updateOutputStates(OutputStates, #cellState{outputs = Outputs} = State) ->
	State#cellState{outputs = outputs:updateOutputStates(OutputStates, Outputs)}.

updateOutputState( #cellState{outputs = Outputs} = CellState, OutputFunction, NewOutputState) ->
	CellState#cellState{outputs = outputs:updateOutputState(Outputs, OutputFunction, NewOutputState)}.
	
%% 
%% updateInterceptState :: CellState -> a -> CellState
%% 

updateInterceptState(#cellState{intercept = Intercept} = CellState, InterceptState) ->
	CellState#cellState{intercept = setelement(2, Intercept, InterceptState)}.

%updateIntercept(Cell)

%% 
%% getFlag :: CellState -> Atom -> Bool
%% 

getFlag(#cellState{flags = Flags} = State, Flag) ->
	case lists:keyfind(Flag, 1, Flags) of
		false -> false;
		{Flag, Value} -> Value
	end.
	
%% 
%% setFlag :: CellState -> Atom -> Bool -> CellState
%% 

setFlag(#cellState{flags = Flags} = State, Flag, Value) ->
	case lists:keytake(Flag, 1, Flags) of
		false -> 
			exit(cant_find_flag);
		{value, OldFlag, RestOfFlags} ->
			State#cellState{ flags = [{Flag, Value}] ++ RestOfFlags }
	end.

%% 
%% updateStash :: CellState -> List Element -> CellState
%% 

updateStash(#cellState{stash = Stash} = State, Elements) ->
	State#cellState{stash = Elements ++ Stash}.
	
%% 
%% getStash :: CellState -> List Element
%% 

getStash(#cellState{stash = Stash}) ->
	Stash.
	
%% 
%% emptyStash :: CellState -> CellState 
%% 

emptyStash(CellState) ->
	CellState#cellState{stash = []}.
	
%% 
%% injectElements :: CellState -> Elements -> Tuple CellState List Element
%% 

injectElements(#cellState{elements = ElementsState} = State, NewElements) ->
	{NewElementState, ElementsResponse} = cellElements:process(ElementsState, NewElements),
	{State#cellState{elements = NewElementState}, ElementsResponse}.

%% 
%% isDone :: CellState -> Bool
%% 

isDone(#cellState{done = Done}) ->
	Done.
%% ====================================================
%% Internal API
%% ====================================================

%% 
%% processFlags :: CellState -> List (Tuple Atom Value) -> CellState
%% 

processFlags(CellState, []) -> CellState;
processFlags(CellState, [H|T]) ->
	processFlags(processFlag(CellState, H), T).

%% 
%% processFlag :: CellState -> Tuple Atom Value -> CellState
%% 

processFlag(CellState, {name, Name}) ->
	CellState#cellState{name = Name};
processFlag(CellState, {Flag, Bool}) ->
	setFlag(CellState, Flag, Bool).



	
%% ====================================================
%% Utilities
%% ====================================================

% state(State, Field) ->
% 	State#cellState.Field.
% 	
% replace(State, Field, NewField) ->
% 	%erlang may not allow this
% 	State#cellState{Field = NewField}.