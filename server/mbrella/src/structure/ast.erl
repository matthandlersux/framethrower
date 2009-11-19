-module(ast).

-compile( export_all ).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).

%% ====================================================
%% TYPES
%% ====================================================
%
%		an AST represents an expression that can be evaluated by the eval module
%
% AST				:: LiteralAST | TupleAST| CellAST | ObjectAST | FunctionAST | LambdaAST | ApplyAST | VariableAST | UnboundVariableAST | ActionMethodAST | InstructionAST
%	LiteralAST			:: {LiteralType, Literal}
%		LiteralType			:: string | number | bool | null | void
%	TupleAST			:: {tuple, Tuple}
%	CellAST				:: {cell, {CellPointer, undefined}}
%	ObjectAST			:: {object, String}
% 	FunctionAST			:: {function, {{Atom, Atom, List}, Number}}
%	LambdaAST			:: {lambda, {Number, AST}}
%	ApplyAST			:: {apply, {(FunctionAST | LambdaAST), [AST]}}
%	ActionMethodAST		:: {actionMethod, {Atom, Atom, List}}
%	InstructionAST		:: {instruction, {Line, Scope}}
%	VariableAST			:: {variable, Number}
%	UnboundVariableAST	:: {unboundVariable, String}
%
%
% 		a DataTerm is a piece of data that can be passed into a FunctionAST as an argument, and passed around inside cells
%
% DataTerm			:: Literal | CellPointer | ObjectPointer | Instruction | ActionMethod | ApplyAST | LambdaAST | FunctionAST | ActionMethodAST | InstructionAST
% 	Literal	 		:: String | Number | Bool | Null | Void
%	 	String				:: List
%	 	Number				:: Number
%	 	Bool				:: Atom	
%	 	Null				:: Atom
%	 	Void				:: Atom
%	Tuple				:: Erlang Tuple
% 	CellPointer 		:: Refer to CellPointer module
% 	ObjectPointer 		:: Refer to Object module

%% ====================================================
%% External API
%% ====================================================

%% ---------------------------------------------
%% Maker functions
%% ---------------------------------------------

%% 
%% makeLiteral :: Literal -> LiteralAST
%% 		
%%		

makeLiteral(String) when is_list(String) ->
	{string, String};

makeLiteral(Number) when is_number(Number) ->
	{number, Number};
	
makeLiteral(Bool) when is_boolean(Bool) ->
	{bool, Bool};

makeLiteral(null) ->
	{null, null};

makeLiteral(void) ->
	{void, void}.


%% 
%% makeTuple :: Tuple -> TupleAST
%% 		
%%		

makeTuple(Tuple) when is_tuple(Tuple) ->
	{tuple, Tuple}.



%%
%% makeUnboundVariable :: String -> UnboundVariableAST
%%
%%

makeUnboundVariable(String) ->
	{unboundVariable, String}.

%% 
%% makeCell :: String -> CellAST
%% 		
%%		

makeCell(Name) when is_list(Name) ->
	CellPointer = env:get(Name),
	Pid = cellPointer:pid(CellPointer),
	makeCell(Name, Pid);

%% 
%% makeCell :: CellPointer -> CellAST
%% 		
%%		

makeCell(CellPointer) when is_tuple(CellPointer) ->
	makeCell(cellPointer:name(CellPointer), cellPointer:pid(CellPointer)).

%% 
%% makeCell :: String -> Pid -> CellAST
%% 		
%%		

makeCell(Name, Pid) ->
	{cell, {cellPointer:create(Name, Pid), undefined}}.
	
%% 
%% makeObject :: (ObjectPointer | String) -> ObjectAST
%% 		
%%		

makeObject(ObjectPointer) when is_tuple(ObjectPointer) ->
	{object, objects:getName(ObjectPointer)};
makeObject(ObjectName) ->
	{object, ObjectName}.

%% 
%% makeFunction :: Atom -> Atom -> Number -> FunctionAST
%% 		
%%		

makeFunction(Module, Name, 0) ->
	ast:makeApply({function, {{Module, Name, []}, 0}}, []);
makeFunction(Module, Name, Arity) ->
	{function, {{Module, Name, []}, Arity}}.


%% 
%% makeFamilyFunction :: Atom -> Number -> List a -> FunctionAST
%% 		
%%		

makeFamilyFunction(Module, Name, 0, Arguments) ->
	ast:makeApply({function, {{Module, Name, Arguments}, 0}}, []);
makeFamilyFunction(Module, Name, Arity, Arguments) ->
	{function, {{Module, Name, Arguments}, Arity}}.


%%
%% makeInstruction :: [JSON] -> Scope -> InstructionAST
%%
%%

makeInstruction(Actions, Scope) ->
	{instruction, {Actions, Scope}}.

%% 
%% makeActionMethod :: Atom -> Atom -> List -> ActionMethodAST
%%
%%

makeActionMethod(Module, Name, Arguments) ->
	{actionMethod, {Module, Name, Arguments}}.


%% 
%% performActionMethod :: ActionMethodAST -> AST
%%
%%

performActionMethod({actionMethod, {Module, Name, Arguments}}) ->
	AM = erlang:apply(Module, Name, Arguments),
	termToAST(AM).

%% 
%% makeVariable :: Number -> VariableAST
%% 		
%%		

makeVariable(Number) ->
	{variable, Number}.

%% 
%% makeLambda :: AST -> LambdaAST
%% 		
%%		

makeLambda(AST) ->
	makeLambda(AST, 1).

%% 
%% makeLambda :: AST -> Number -> LambdaAST
%% 		
%%		

makeLambda({lambda, {NumOfVariables, AST}}, NewNumOfVariables) ->
	{lambda, {NewNumOfVariables + NumOfVariables, AST}};
makeLambda(AST, NumOfVariables) ->
	{lambda, {NumOfVariables, AST}}.

%% 
%% makeApply :: AST -> AST -> ApplyAST
%% 			:: AST -> List AST -> ApplyAST
%%		

makeApply({apply, {AST, ListOfParameters}}, Parameters) when is_list(Parameters) ->
	{apply, {AST, ListOfParameters ++ Parameters}};
makeApply({apply, {AST, ListOfParameters}}, NewParameter) ->
	{apply, {AST, ListOfParameters ++ [NewParameter]}};
makeApply(AST, Parameters) when is_list(Parameters) ->
	{apply, {AST, Parameters}};
makeApply(AST, Parameter) ->
	{apply, {AST, [Parameter]}}.


%% ---------------------------------------------
%% Getter Functions
%% ---------------------------------------------

%% 
%% getString :: LiteralAST -> String
%% 		
%%		

getString(Input) -> getFlatValue(Input).

%% 
%% getNumber :: LiteralAST -> Number
%% 		
%%		

getNumber(Input) -> getFlatValue(Input).

%% 
%% getBool :: LiteralAST -> Bool
%% 		
%%		

getBool(Input) -> getFlatValue(Input).

%% 
%% getNull :: LiteralAST -> Null
%% 		
%%		

getNull(Input) -> getFlatValue(Input).

%% 
%% getVariable :: LiteralAST -> Variable
%% 		
%%		

getVariable({variable, Value}) -> Value.

%% 
%% getInstructionActions :: InstructionAST -> List of Action JSON
%%
%%

getInstructionActions({_, {Actions, _}}) -> Actions.

%% 
%% getInstructionScope :: InstructionAST -> Scope
%%
%%

getInstructionScope({_, {_, Scope}}) -> Scope.

%% 
%% getCellName :: CellAST -> CellName
%% 		
%%		

getCellName({_, {CellPointer, _}}) -> cellPointer:name(CellPointer).

%% 
%% getCellPid :: CellAST -> Pid
%% 		
%%		

getCellPid({_, {CellPointer, _}}) -> cellPointer:pid(CellPointer).

%% 
%% getObject :: ObjectAST -> String
%% 		
%%		

getObject({object, ObjectName}) -> ObjectName.

%% 
%% getFunctionName :: FunctionAST -> Atom
%% 		
%%		

getFunctionName({_, {{_Mod, Name, _Arg}, _}}) -> Name.

%% 
%% getLambdaAST :: LambdaAST -> AST
%% 		
%%		

getLambdaAST({_, {_, AST}}) -> AST.

%% 
%% getApplyFunction :: ApplyAST -> (FunctionAST| LambdaAST)
%%
%%		

getApplyFunction({_, {AST, _}}) -> AST.

%% 
%% getApplyParameters :: ApplyAST -> List AST
%%
%%

getApplyParameters({_, {_, ListOfParameters}}) -> ListOfParameters.

%% 
%% getArity :: (FunctionAST | LambdaAST | ApplyAST) -> Number
%% 		takes a function, lambda, or apply
%%		

getArity({function, {_NameOrTuple, Arity}}) -> Arity;
getArity({lambda, {NumVars, _AST}}) -> NumVars;
getArity({apply, { AST , Parameters}}) -> getArity(AST) - length(Parameters).

%%
%% type :: AST -> Atom
%%
%%

type({Type, _Data}) when is_atom(Type) ->
	Type.
	
%% 
%% apply :: FunctionAST -> List AST -> AST
%% 		takes care of apply for everyone
%%		

apply(AST, Parameter) when not is_list(Parameter) ->
	ast:apply(AST, [Parameter]);
apply({function, {{Module, Name, Arguments}, _Arity}}, ListOfParameters) ->
	case {Module, Name} of
		{action, closure} ->
			% closureFunction :: [AST] -> AST
			erlang:apply(action, closureFunction, Arguments ++ [ListOfParameters]);
		{family, _} ->
            FamilyFunction = erlang:apply(family, Name, Arguments),
            Result = lists:foldl(fun(A, F) -> F(A) end, FamilyFunction, toTerm(ListOfParameters)),
			termToAST(Result);
		_ ->
			Result = erlang:apply(Module, Name, Arguments ++ toTerm(ListOfParameters)),
			termToAST(Result)
	end.

%% 
%% betaReduce :: LambdaAST -> List AST -> AST
%% 		
%%		
	
betaReduce(Lambda, ListOfReplacements) ->
	NumReplacements = length(ListOfReplacements),
	{lambda, {Num, AST}} = betaReduce(Lambda, ListOfReplacements, 0),
	if
		Num =:= NumReplacements -> AST;
		true -> makeLambda(AST, Num - NumReplacements)
	end.

%% 
%% termToAST :: DataTerm -> AST
%% 		
%%		

termToAST(Literal) when not is_tuple(Literal) ->
	makeLiteral(Literal);
termToAST(Term) ->
	case cellPointer:isCellPointer(Term) of
		true ->
			makeCell( Term );
		false -> case objects:isObjectPointer(Term) of
			true -> makeObject(Term);
			_ -> case Term of
				{actionMethod, _} = ActionMethod -> ActionMethod;
				Tuple when is_tuple(Tuple) -> 
					makeTuple(list_to_tuple(lists:map(fun termToAST/1, tuple_to_list(Tuple))));
				_ -> throw([not_yet_implemented, Term])
			end
		end
	end.

%% ====================================================
%% Internal API
%% ====================================================

%%
%% getFlatValue :: LiteralAST -> Literal
%%
%%

getFlatValue({_, Value}) -> Value.

%% 
%% betaReduce :: AST -> AST -> Number -> AST
%% 		
%%		

betaReduce([], _, _) -> [];
betaReduce([H|T], Replacement, Index) ->
	[ betaReduce(H, Replacement, Index) | betaReduce(T, Replacement, Index) ];
betaReduce({lambda, {Num, AST}}, Replacement, Index) ->
	makeLambda(
		betaReduce(AST, Replacement, Index + Num),
		Num
	);
betaReduce({apply, {AST, ListOfParameters}}, Replacement, Index) ->
	makeApply(
		betaReduce(AST, Replacement, Index),
		betaReduce(ListOfParameters, Replacement, Index)
	);
betaReduce({variable, Index}, [Replacement|_Rest], Index) ->
	Replacement;
betaReduce({variable, VarIndex} = Variable, Replacements, Index) ->
	if
		(Index - length(Replacements) + 1) =< VarIndex andalso VarIndex < Index ->
			lists:nth(Index - VarIndex + 1, Replacements);
		true ->
			Variable
	end;
betaReduce(AST, _Replacement, _Index) ->
	AST.
		
%% 
%% mapType :: Atom -> AST -> (AST -> AST) -> AST
%% 
%%
	
mapType(Type, {Type, _} = AST, MapFunction) ->
	MapFunction(AST);
mapType(Type, {lambda, {Num, AST}}, MapFunction) ->
	makeLambda(
		mapType(Type, AST, MapFunction),
		Num
	);
mapType(Type, {apply, {AST, ListOfParameters}}, MapFunction) ->
	makeApply(
		mapType(Type, AST, MapFunction),
		lists:map(fun(Elem) ->
			mapType(Type, Elem, MapFunction)
		end, ListOfParameters)
	);
mapType(_Type, AST, _MapFunction) ->
	AST.
	
	
%% 
%% toTerm :: AST -> DataTerm
%% 		:: [AST] -> [DataTerm]
%%

toTerm([]) -> 
	[];
toTerm([H|T]) ->
	[toTerm(H)|toTerm(T)];
toTerm({cell, {CellPointer, _BottomExpr}}) ->
	CellPointer;
toTerm({object, Name}) ->
	{objectPointer, Name};
toTerm({function, _} = Function) ->
	Function;
toTerm({apply, _} = Apply) ->
	Apply;
toTerm({lambda, _} = Lambda) ->
	Lambda;
toTerm({actionMethod, _} = ActionMethod) ->
	ActionMethod;
toTerm({instruction, _} = Instruction) ->
	Instruction;
toTerm({tuple, Tuple}) ->
	list_to_tuple(lists:map(fun toTerm/1, tuple_to_list(Tuple)));
toTerm({_LiteralType, LiteralValue}) ->
	LiteralValue;
toTerm(Term) ->
	Term.
