-module(ast).

-compile( export_all ).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

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
% Function			:: Tuple Atom Number
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
%% makeObject :: String -> AST
%% 		
%%		

makeObject(Name) ->
	{object, Name}.

%% 
%% makeFunction :: Atom -> Number -> AST
%% 		
%%		

makeFunction(Name, 0) ->
	ast:apply({function, {Name, 0}}, []);
makeFunction(Name, Arity) ->
	{function, {Name, Arity}}.
	
%% 
%% makeAccessor :: Atom -> Atom -> AST
%% 		accessors are always arity 1
%%		

makeAccessor(ClassName, FieldName) ->
	{function, {{accessor, [ClassName, FieldName]}, 1}}.
	
%% 
%% makeFamilyFunction :: Atom -> Number -> List a -> AST
%% 		
%%		

makeFamilyFunction(Name, Arity, Arguments) ->
	{function, {{Name, Arguments}, Arity}}.

%% 
%% makeClosure :: LineTemplate (JSON) -> Scope -> Arity -> AST
%%
%%		

makeClosure(Params, Output, Scope, 0) ->
	ast:apply({function, {{closure, [Params, Output, Scope]}, 0}}, []);
makeClosure(Params, Output, Scope, Arity) ->
	{function, {{closure, [Params, Output, Scope]}, Arity}}.

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
	{apply, {AST, Parameters ++ ListOfParameters}};
makeApply({apply, {AST, ListOfParameters}}, NewParameter) ->
	{apply, {AST, [NewParameter] ++ ListOfParameters}};
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

getApplyParameters({_, {_, ListOfParameters}}) -> lists:reverse( ListOfParameters ).

%% 
%% extractApplyParameters :: AST -> List AST
%% 		used when you want to preserve the internal ordering of the list of parameters... mainly because they get reversed
%%		

extractApplyParameters({_, {_, ListOfParameters}}) -> ListOfParameters.

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
%% apply :: AST -> List AST -> AST | CellPointer | ObjectPointer | Literal ... etc...
%% 		takes care of apply for everyone
%%		

apply(AST, Parameter) when not is_list(Parameter) ->
	ast:apply(AST, [Parameter]);
apply({function, {{Family, Arguments}, _Arity}}, ListOfParameters) ->
	case Family of
		accessor ->
			erlang:apply(objects, accessor, Arguments ++ toTerm(ListOfParameters));
		closure ->
			% closure take the listOfParameters as a List of ASTs so it can run evaluate
			erlang:apply(action, closureFunction, Arguments ++ [ListOfParameters]);
		_ ->
			FamilyFunction = erlang:apply(family, Family, Arguments),
			lists:foldl(fun(A, F) -> F(A) end, FamilyFunction, toTerm(ListOfParameters))
	end;
apply({function, {Name, _Arity}}, ListOfParameters) ->
	erlang:apply(primFuncs, Name, toTerm(ListOfParameters)).

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
		false ->
			exit(not_yet_implemented)
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
toTerm({object, Name}) ->
	Name;
toTerm({cell, {CellPointer, _BottomExpr}}) ->
	CellPointer;
toTerm({function, _} = Function) ->
	Function;
toTerm({apply, _} = Apply) ->
	Apply;
toTerm({lambda, _} = Lambda) ->
	Lambda;
toTerm(Term) ->
	Term.
