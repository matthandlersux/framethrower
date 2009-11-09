-module (cellState).
-compile(export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).

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
% dock = [{CellPointer, ElementList}]

% optimizations:
% make connections a dict,
% make dock keyed on elements/output rather than cellpointer (duplicates element storage),
% make informants a dict if larger than x (invert has a lot of informants, also unfoldSet etc...)

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
	flags = [{leashed, false}, {waitForDone, false}, {killOnEmpty, false}, {killOnNoConnections, true}],
	informants = [],
	dock = [],
	bottom
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

injectOutput(#cellState{outputs = Outputs} = State, OutputFunction, OutputTo) ->
	%%%% TODO when there are a lot of outputs, switch from a list to a dict
	State#cellState{outputs = outputs:addOutput(OutputFunction, OutputTo, Outputs)}.

%% 
%% uninjectOutput :: CellState -> OutputFunction -> CellPointer -> CellState
%% 

uninjectOutput(#cellState{outputs = Outputs} = State, OutputFunction, OutputTo) ->
	State#cellState{outputs = outputs:removeOutput(OutputFunction, OutputTo, Outputs)}.

%% 
%% injectIntercept :: CellState -> Intercept -> CellState
%% 

injectIntercept(State, Intercept) ->
	State#cellState{intercept = Intercept}.

%% 
%% updateBottom :: CellState -> AST -> CellState
%% 		
%%		

updateBottom(State, AST) ->
	State#cellState{bottom = AST}.
	
%% 
%% addInformants :: CellState -> List CellPointers -> CellState
%% 

addInformants(CellState, ListOfCellPointers) ->
	AddInformant = 	fun(CellPointer, State) ->
						addInformant(State, CellPointer)
					end,
	lists:foldl(AddInformant, CellState, ListOfCellPointers).

%% 
%% addInformant :: CellState -> CellPointer -> CellState
%% 		
%%		

addInformant(#cellState{informants = Informants} = CellState, CellPointer) ->
	% CellState#cellState{informants = [{CellPointer, false}] ++ Informants}.
	?colortrace(CellPointer),
	case lists:keytake(CellPointer, 1, Informants) of
		{value, {_CellPointer, Done, Weight}, RestOfInformants} ->
			CellState#cellState{informants = [{CellPointer, Done, Weight + 1}] ++ RestOfInformants};
		false ->
			CellState#cellState{informants = [{CellPointer, false, 1}] ++ Informants}
	end.

%% 
%% removeInformant :: CellState -> CellPointer -> CellState
%% 		
%%		

removeInformant(#cellState{informants = Informants} = CellState, CellPointer) ->
	case lists:keytake(CellPointer, 1, Informants) of
		{value, {_CellPointer, Done, 1}, RestOfInformants} ->
			CellState#cellState{informants = RestOfInformants};
		{value, {_CellPointer, Done, Weight}, RestOfInformants} ->
			CellState#cellState{informants = [{CellPointer, Done, Weight - 1}] ++ RestOfInformants};
		false ->
			exit(removed_informant_that_didnt_exist)
	end.

%% 
%% setDone :: CellState -> CellPointer -> CellState
%% 

setDone(#cellState{informants = Informants, done = Done} = State, CellPointer) ->
	if
		Done -> State;
		true ->
			FindCellPointer = 	fun({CellPointerFromList, IsDone, Weight}, IsTotalDone) ->
									if 
										IsDone andalso IsTotalDone ->
											{{CellPointerFromList, IsDone, Weight}, true};
										IsDone andalso (not IsTotalDone) ->
											{{CellPointerFromList, IsDone, Weight}, false};
										CellPointer =:= CellPointerFromList ->
											{{CellPointerFromList, true, Weight}, IsTotalDone};
										not IsDone ->
											{{CellPointerFromList, IsDone, Weight}, false};
										true ->
											{{CellPointerFromList, IsDone, Weight}, IsDone}
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
%% updateDock :: CellState -> CellPointer -> List Element -> CellState
%% 

updateDock(#cellState{dock = Dock} = State, CellPointer, Elements) ->
	case lists:keytake(CellPointer, 1, Dock) of
		false ->
			State#cellState{ dock = [{CellPointer, Elements}] ++ Dock };
		{value, {_CellPointer, OldElements}, RestOfDock} ->
			State#cellState{ dock = [{CellPointer, Elements ++ OldElements}] ++ RestOfDock }
	end.
	
%% 
%% getDock :: CellState -> CellPointer -> List Element
%% 

getDock(#cellState{dock = Dock}, CellPointer) ->
	case lists:keyfind(CellPointer, 1, Dock) of
		false -> [];
		{_, ElementList} -> ElementList
	end.

getDock(#cellState{dock = Dock}) ->
	Dock.
	
%% 
%% emptyDock :: CellState -> CellPointer -> CellState 
%% 

emptyDock(#cellState{dock = Dock} = CellState, CellPointer) ->
	CellState#cellState{dock = lists:keydelete(CellPointer, 1, Dock)}.

emptyDock(CellState) ->
	CellState#cellState{dock = []}.
	
%% 
%% emptyElements :: CellState -> CellState
%% 		
%%		

emptyElements(#cellState{elements = Elements} = CellState) ->
	Type = cellElements:type(Elements),
	CellState#cellState{elements = cellElements:new(Type)}.

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