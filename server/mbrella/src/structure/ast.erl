-module(ast).

-compile( export_all ).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).

%% ====================================================
%% TYPES
%% ====================================================

% Literal	 		:: String | Number | Bool | Null
% Null				:: Atom
% String 			:: List
% Bool				:: Atom
% AST				:: Tuple Atom ASTData
% ASTData			:: Literal | Tuple 
% 					ie 		{CellPointer, BottomExpr} | Function | {AST, List}
% Function			:: Tuple {function, {Atom, Atom, List}, Number}
% ActionMethod		:: Tuple {actionMethod, {Atom, Atom, List}}
% AccessorFunction	:: Tuple (Tuple Atom Parameter) Number
% CellPointer 		:: Tuple String Pid

%% ====================================================
%% External API
%% ====================================================

%% ---------------------------------------------
%% Maker functions
%% ---------------------------------------------

%% 
%% makeLiteral :: Literal -> AST
%% 		
%%		

makeLiteral(String) when is_list(String) ->
	{string, String};

makeLiteral(Number) when is_number(Number) ->
	{number, Number};
	
makeLiteral(Bool) when is_boolean(Bool) ->
	{bool, Bool};

makeLiteral(null) ->
	{null, null}.

%% 
%% makeUnboundVariable :: String -> AST
%% 		
%%		

makeUnboundVariable(String) ->
	{unboundVariable, String}.

%% 
%% makeCell :: String -> AST
%% 		
%%		

makeCell(Name) when is_list(Name) ->
	CellPointer = env:get(Name),
	Pid = cellPointer:pid(CellPointer),
	makeCell(Name, Pid);

%% 
%% makeCell :: CellPointer -> AST
%% 		
%%		

makeCell(CellPointer) when is_tuple(CellPointer) ->
	makeCell(cellPointer:name(CellPointer), cellPointer:pid(CellPointer)).

%% 
%% makeCell :: String -> Pid -> AST
%% 		
%%		

makeCell(Name, Pid) ->
	{cell, {{Name, Pid}, undefined}}.
	
%% 
%% makeObject :: (ObjectPointer | String) -> AST
%% 		
%%		

makeObject(ObjectPointer) when is_tuple(ObjectPointer) ->
	{object, objects:getName(ObjectPointer)};
makeObject(ObjectName) ->
	{object, ObjectName}.

%% 
%% makeFunction :: Atom -> Atom -> Number -> AST
%% 		
%%		

makeFunction(Module, Name, 0) ->
	ast:makeApply({function, {{Module, Name, []}, 0}}, []);
makeFunction(Module, Name, Arity) ->
	{function, {{Module, Name, []}, Arity}}.


%% 
%% makeFamilyFunction :: Atom -> Number -> List a -> AST
%% 		
%%		

makeFamilyFunction(Module, Name, 0, Arguments) ->
	ast:makeApply({function, {{Module, Name, Arguments}, 0}}, []);
makeFamilyFunction(Module, Name, Arity, Arguments) ->
	{function, {{Module, Name, Arguments}, Arity}}.


%% 
%% makeActionMethod :: ActionMethod -> AST
%% 	(for now they have same representation)
%%

makeActionMethod(ActionMethod) ->
	ActionMethod.


%%
%% makeInstruction :: Instruction -> AST
%% (for now they have same representation)
%%

makeInstruction(Instruction) ->
	Instruction.

%% 
%% performActionMethod :: AST -> AST | CellPointer | ObjectPointer | Literal ... etc...
%%
%%

performActionMethod({actionMethod, {Module, Name, Arguments}}) ->
	erlang:apply(Module, Name, Arguments).	


%% 
%% makeVariable :: Number -> AST
%% 		
%%		

makeVariable(Number) ->
	{variable, Number}.

%% 
%% makeLambda :: AST -> AST
%% 		
%%		

makeLambda(AST) ->
	makeLambda(AST, 1).

%% 
%% makeLambda :: AST -> Number -> AST
%% 		
%%		

makeLambda({lambda, {NumOfVariables, AST}}, NewNumOfVariables) ->
	{lambda, {NewNumOfVariables + NumOfVariables, AST}};
makeLambda(AST, NumOfVariables) ->
	{lambda, {NumOfVariables, AST}}.

%% 
%% makeApply :: AST -> a -> AST
%% 			:: AST -> List a -> AST
%%		

makeApply({apply, {AST, ListOfParameters}}, Parameters) when is_list(Parameters) ->
	?colortrace(possible_parameter_mixup),
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
%% getString :: AST -> String
%% 		
%%		

getString(Input) -> getFlatValue(Input).

%% 
%% getNumber :: AST -> Number
%% 		
%%		

getNumber(Input) -> getFlatValue(Input).

%% 
%% getBool :: AST -> Bool
%% 		
%%		

getBool(Input) -> getFlatValue(Input).

%% 
%% getNull :: AST -> Null
%% 		
%%		

getNull(Input) -> getFlatValue(Input).

%% 
%% getVariable :: AST -> Variable
%% 		
%%		

getVariable(Input) -> getFlatValue(Input).

%% 
%% getInstructionActions :: AST -> List of Action JSON
%%
%%

getInstructionActions({_, {Actions, _}}) -> Actions.

%% 
%% getInstructionScope :: AST -> Scope
%%
%%

getInstructionScope({_, {_, Scope}}) -> Scope.

%% 
%% getCellName :: AST -> CellName
%% 		
%%		

getCellName({_, {{Name, _}, _}}) -> Name.

%% 
%% getObject :: AST -> String
%% 		
%%		

getObject(Object) -> getFlatValue(Object).

%% 
%% getCellPid :: AST -> Pid
%% 		
%%		

getCellPid({_, {{_, Pid}, _}}) -> Pid.

%% 
%% getFunctionName :: AST -> Atom
%% 		
%%		

getFunctionName({_, {Name, _}}) -> Name.

%% 
%% getLambdaAST :: AST -> AST
%% 		
%%		

getLambdaAST({_, {_, AST}}) -> AST.

%% 
%% getApplyFunction :: AST -> AST
%% 		
%%		

getApplyFunction({_, {AST, _}}) -> AST.

%% 
%% getApplyParameters :: AST -> List AST
%% 		
%%		

getApplyParameters({_, {_, ListOfParameters}}) -> ListOfParameters.

%% 
%% getArity :: AST -> Number
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
%% apply :: AST -> List AST -> AST
%% 		takes care of apply for everyone
%%		

apply(AST, Parameter) when not is_list(Parameter) ->
	ast:apply(AST, [Parameter]);
apply({function, {{Module, Name, Arguments}, _Arity}}, ListOfParameters) ->
	Result = case {Module, Name} of
		{action, closure} ->
			% closure take the listOfParameters as a List of ASTs so it can run evaluate
			erlang:apply(action, closureFunction, Arguments ++ [ListOfParameters]);
		{family, _} ->
            FamilyFunction = erlang:apply(family, Name, Arguments),
            lists:foldl(fun(A, F) -> F(A) end, FamilyFunction, toTerm(ListOfParameters));
		_ ->
			erlang:apply(Module, Name, Arguments ++ toTerm(ListOfParameters))
	end,
	termToAST(Result).

%% 
%% betaReduce :: AST -> List AST -> AST
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
%% termToAST :: ErlangTerm -> AST
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
			_ -> case action:isInstruction(Term) of
				true -> makeInstruction(Term);
				_ -> case actions:isActionMethod(Term) of
					true -> makeActionMethod(Term);
					_ -> throw([not_yet_implemented, Term])
				end
			end
		end
	end.

%% ====================================================
%% Internal API
%% ====================================================

%% 
%% getFlatValue :: AST -> String | Number | Bool | Null
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
%% mapType :: AstType -> AST -> (String -> AST) -> AST
%% 
%%
	
mapType(Type, {Type, Value}, MapFunction) ->
	MapFunction(Value);
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
%% toTerm :: AST -> ErlangTerm
%% 		:: List AST -> List Erlang Term
%%		

toTerm([]) -> 
	[];
toTerm([H|T]) ->
	[toTerm(H)|toTerm(T)];
toTerm({string, String}) ->
	String;
toTerm({number, Number}) ->
	Number;
toTerm({bool, Bool}) ->
	Bool;
toTerm({null, Null}) ->
	Null;
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
toTerm(Term) ->
	Term.
