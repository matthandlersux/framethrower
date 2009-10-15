-module (outputs).
-compile(export_all).

%-include().

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).

%% ====================================================
%% NOTES
%% ====================================================

%any function that makes use of elements that are cellpointers needs to lookup the pid of the cell
%or send a message with a "i think you are this guy" message, or needs some quick pingback to make sure
%that the cell exists still and is the cell that it thinks it is

%% ====================================================
%% TYPES
%% ====================================================

% Output :: Tuple3 SendTo OutputFunction OutputState
% Outputs :: List Output (maybe will change to a dict or something else)
%
% SendTo :: List CellPointer
% OutputFunction :: Tuple Atom (List Arguments)
% OutputState :: a
% Arguments :: b

% example: Outputs: [ { [CellPointer1, Cellpointer2], {takeOne, []}, {add, Element} }, {...} ]

%% ====================================================
%% External API
%% ====================================================

%% 
%% call :: Output -> ElementState -> List Element -> Tuple OutputState List Element
%% 

call({_, OutputFunction, OutputState}, Elements, ElementsToAdd) ->
	call(OutputFunction, OutputState, Elements, ElementsToAdd).

call({send, []}, _, _, ElementsToAdd) ->
	{undefined, ElementsToAdd};	
call(OutputFunction, OutputState, Elements, ElementsToAdd) ->
	Name = getName(OutputFunction),
	Args = getArgs(OutputFunction),
	callOutput(Name, Args, OutputState, Elements, ElementsToAdd).

%% 
%% callOutput :: FunctionName -> Arguments -> OutputState -> ElementState -> Elements -> Tuple OutputState Elements
%%		used by a cell when adding a new outputFunction or receiving a new element
%%		returns the new state of that outputFunction and the elements to be sent
%% 

callOutput(Name, Args, State, ElementsState, []) ->
	try processElement(Name, Args, State, ElementsState, [])
	catch
		throw:NewStateAndElements ->
			NewStateAndElements;
		_:_ ->
			{State, []}
	end;
callOutput(Name, Args, State, ElementsState, Elements) ->
	Process = fun(Element, {OldState, OldElements}) ->
		{NewState, NewElements} = processElement(Name, Args, OldState, ElementsState, Element),
		{NewState, NewElements ++ OldElements}
	end,
	try lists:foldr(Process, {State, []}, Elements)
	catch
		throw:NewStateAndElements -> 
			NewStateAndElements
	end.

callOutput(Name, ElementsState, Elements) ->
	callOutput(Name, [], [], ElementsState, Elements).
	
callOutput(Name, Args, ElementsState, Elements) ->
	callOutput(Name, Args, [], ElementsState, Elements).

%% ====================================================
%% External API for dealing with Output State
%% ====================================================

%% 
%% newState :: Outputs
%% 

newState() ->
	[{newConnections(), standard(), undefined}].
	
%% 
%% standard :: OutputFunction
%%   this is the standard output function, it has no functional part, it sends elements straight through
%% 

standard() -> {send, []}.

%% 
%% newConnections :: SendTo
%% 

newConnections() -> [].

%% 
%% injectOutput :: OutputFunction -> CellPointer -> Outputs -> Outputs
%% 

% injectOutput(OutputFunction, SendTo, OutputState) ->
% 	case getOutput(OutputFunction, OutputState) of
% 		error ->
% 			todo;
% 		Output ->
% 			Connections = getConnections(Output),
% 			todo
% 	end.
			

%%  need to change to informers
%% getConnections :: Output -> List CellPointer
%% 

getConnections({Connections, _NameAndArgs, _State}) ->
	Connections.
	
%% 
%% toList :: Outputs -> List Output
%% 

toList(Outputs) -> Outputs.

%% 
%% updateOutputStates :: List OutputStates -> Outputs -> Outputs
%% 

updateOutputStates(NewOutputStates, Outputs) ->
	Combine = fun(OutputState, Output) -> setelement(3, Output, OutputState) end,
	lists:zipwith(Combine, NewOutputStates, Outputs).
	
%% 
%% updateOutputState :: Outputs -> OutputFunction | Output -> a -> Outputs
%% 

updateOutputState(Outputs, {_,OutputFunction,_}, OutputState) ->
	updateOutputState(Outputs, OutputFunction, OutputState);
updateOutputState(Outputs, OutputFunction, OutputState) ->
	case lists:keytake(OutputFunction, 2, Outputs) of
		false ->
			exit(some_wrong_call_to_update_outputs),
			Outputs;
		{value, OldOutput, OutputsLeftOver} ->
			[setelement(3, OldOutput, OutputState)] ++ OutputsLeftOver
	end.
	
%% 
%% getOutput :: Atom | OutputFunction -> OutputState -> Output
%% 

getOutput(OutputName, OutputState) when is_atom(OutputName) -> getOutput({OutputName, []}, OutputState);
getOutput(OutputFunction, OutputState) ->
	lists:keyfind(OutputFunction, 2, OutputState).
	
%% 
%% addOutput :: OutputFunction -> CellPointer -> Outputs -> Outputs
%% 

addOutput(OutputFunction, OutputTo, Outputs) ->
	case lists:keytake(OutputFunction, 2, Outputs) of
		false ->
			[construct(OutputTo, OutputFunction)] ++ Outputs;
		{value,{Connections, _OutputFunction, _OutputState} = OldOutput, OutputsLeftOver} ->
			case lists:member(OutputTo, Connections) of
				true ->
					Outputs;
				false -> [setelement(1, OldOutput, [OutputTo] ++ Connections)] ++ OutputsLeftOver
			end
	end.
	
%% 
%% removeOutput :: OutputFunction -> CellPointer -> Outputs -> Outputs
%% 

removeOutput(OutputFunction, OutputTo, Outputs) ->
	case lists:keytake(OutputFunction, 2, Outputs) of
		false ->
			Outputs;
		{value, {Connections, OutputFunction, _OutputState} = OldOutput, OutputsLeftOver} ->
			case Connections -- [OutputTo] of
				[] when OutputFunction =/= {send, []} ->
					OutputsLeftOver;
				LeftoverConnections ->
					[setelement(1, OldOutput, LeftoverConnections)] ++ OutputsLeftOver
			end
	end.

%% ====================================================
%% Internal API
%% ====================================================


%% 
%% toFunction :: Name | Tuple Name (List Value) -> Tuple Name (List Value)
%% 

toFunction(OutputFunction) when is_tuple(OutputFunction) -> OutputFunction;
toFunction(Name) when is_atom(Name) -> {Name, []}.

%% 
%% processElement :: Atom -> List Value -> OutputState -> ElementState -> Element -> 
%%					Tuple OutputState (List Element) | Tuple3 Atom OutputState (List Element)
%% 

processElement(Name, Args, OutputState, ElementsState, Element) ->
	case erlang:apply(outputs, Name, Args ++ [OutputState] ++ [ElementsState] ++ [Element]) of
		{NewState, Elements} when is_list(Elements) ->
			{NewState, Elements};
		{NewState, Elements} when is_tuple(Elements) ->
			{NewState, [Elements]}
	end.

getName({_SendTo, {Name, _Args}, _State}) -> Name;
getName({Name, _Args}) -> Name.	

getArgs({_SendTo, {_Name, Args}, _State}) -> Args;
getArgs({_Name, Args}) -> Args.

getState({_SendTo, {_Name, _Args}, State}) -> State.



%% 
%% construct :: CellPointer -> Atom -> List a -> Output
%% 

construct(CellPointerSendTo, Name, Args) ->
	{[CellPointerSendTo], {Name, Args}, construct({Name, Args})}.

%% 
%% construct :: CellPointer -> OutputFunction | OutputName -> Output
%%		used by primFuncs to create an output and construct its state
%% 

construct(CellPointerSendTo, {Name, Args}) ->
	{[CellPointerSendTo], {Name, Args}, construct({Name, Args})};
construct(CellPointerSendTo, Name) ->
	construct(CellPointerSendTo, {Name, []}).

%% 
%% construct :: OutputFunction -> OutputState
%% 

construct({Name, Args}) ->
	erlang:apply(outputs, Name, []).
	
%% ====================================================
%% Outputs For Primfuncs
%% ====================================================

%% 
%% calling the function without any parameters is the constructor for the state
%% 

%% 
%% isEmpty :: Set a -> Unit Null
%% 

isEmpty() -> 
	empty.
	
isEmpty(null, ElementsState, _Element) ->
	case cellElements:isEmpty(ElementsState) of
		true ->
			throw({null, []});
		false ->
			throw({empty, [cellElements:createRemove(null)]})
	end;
isEmpty(empty, ElementsState, _Element) ->
	case cellElements:isEmpty(ElementsState) of
		true ->
			throw({null, [cellElements:createAdd(null)]});
		false ->
			throw({empty, []})
	end.
		
%% 
%% takeOne :: Set a -> Unit a
%% 

takeOne() -> undefined.

takeOne(undefined, _, Element) ->
	case cellElements:modifier(Element) of
		add -> {cellElements:value(Element), Element};
		remove -> {undefined, []}
	end;
takeOne(OneElement, ElementsState, Element) ->
	Value = cellElements:value(Element),
	case cellElements:modifier(Element) of
		add -> {OneElement, []};
		remove -> 
			if
				Value =:= OneElement ->
					NewElement = cellElements:takeOne(ElementsState),
					NewVal = 	if 
									NewElement =:= [] -> 
										NewElement1 = [],
										undefined; 
									true -> 
										NewElement1 = [NewElement],
										cellElements:value(NewElement)
								end,
					{NewVal, NewElement1 ++ [cellElements:createRemove(Value)]};
				true -> {OneElement, []}
			end
	end.
			
%% 
%% invert :: Map a (Set b)
%% 

invert() -> undefined.

invert(CellPointer, _State, _ElementsState, Element) ->
	Modifier = cellElements:modifier(Element),
	SetOfBCellPointer = cellElements:mapValue(Element),
	ATag = cellElements:mapKey(Element),
	if 
		Modifier =:= add ->
			cell:addInformant(CellPointer, SetOfBCellPointer),
			cell:injectOutput(SetOfBCellPointer, CellPointer, sendMapValueAsKey, [ATag]);
		true ->
			cell:removeInformant(CellPointer, SetOfBCellPointer),
			cell:uninjectOutput(SetOfBCellPointer, CellPointer, sendMapValueAsKey, [ATag])
	end,
	{undefined, []}.

%% 
%% sendMap :: a -> Map a b
%% 		converts a -> Map Key a used by returnUnitMap
%%		

sendMap() -> undefined.

sendMap(Key, _State, _ElementsState, Element) ->
	Modifier = cellElements:modifier(Element),
	Value = cellElements:value(Element),
	{undefined, cellElements:createMap(Modifier, Key, Value)}.

%% 
%% sendMapValueAsKey :: a -> Map b a
%% 		converts a -> Map Key a used by invert
%%		

sendMapValueAsKey() -> undefined.

sendMapValueAsKey(Key, _State, _ElementsState, Element) ->
	Modifier = cellElements:modifier(Element),
	Value = cellElements:value(Element),
	{undefined, cellElements:createMap(Modifier, Value, Key)}.

%% 
%% becomeInformant :: 
%% 		if the value is a cell, make that cell an informant for the InformToCellPointer. used by 
%%		unfoldSet
%% 

becomeInformant() -> false.

becomeInformant(InformToCellPointer, IsInformant, _ElementsState, Element) ->
	Value = cellElements:value(Element),
	Modifier = cellElements:modifier(Element),
	case cellPointer:isCellPointer(Value) of
		true ->
			if
				Modifier =:= add andalso IsInformant -> {IsInformant, Element};
				Modifier =:= add -> 
					cell:addInformant(InformToCellPointer, Value),
					{true, Element};
				Modifier =:= remove andalso IsInformant -> 
					cell:removeInformant(InformToCellPointer, Value),
					{false, Element};
				true -> {IsInformant, Element}
			end;
		false -> {IsInformant, Element}
	end.
					
%% 
%% applyAndInject
%% 		
%%		

applyAndInject() -> undefined.

applyAndInject(AST, InjectToCellPointer, _State, _ElementsState, Element) ->
	applyAndInject(AST, InjectToCellPointer, send, [], undefined, undefined, Element).
	
applyAndInject(AST, InjectToCellPointer, OutputName, _State, _ElementsState, Element) ->
	applyAndInject(AST, InjectToCellPointer, OutputName, [], undefined, undefined, Element).

applyAndInject(AST, InjectToCellPointer, OutputName, OutputArgs, _State, _ElementsState, Element) ->
	NewAST = 	case cellElements:value(Element) of
					{Key, Value} ->
						eval:evaluate( ast:makeApply(AST, ast:termToAST(Key) ) );
					Value ->
						AST
				end,			
	NewCellPointer = eval:evaluate( ast:makeApply(NewAST, ast:termToAST(Value) ) ),
	case cellElements:modifier(Element) of
		add ->
			cell:addInformant(InjectToCellPointer, NewCellPointer),
			cell:injectOutput(NewCellPointer, InjectToCellPointer, OutputName, OutputArgs);
		remove ->
			cell:removeInformant(InjectToCellPointer, NewCellPointer),
			cell:uninjectOutput(NewCellPointer, InjectToCellPointer, OutputArgs, OutputArgs)
	end,
	{undefined, []}.	
			
%% ====================================================
%% Utilities
%% ====================================================

