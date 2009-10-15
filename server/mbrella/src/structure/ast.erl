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
%% makeFunction :: Atom -> Number -> AST
%% 		
%%		

makeFunction(Name, Arity) ->
	{function, {Name, Arity}}.

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
	{lambda, {1, AST}}.

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
%% 		
%%		

makeApply({apply, {AST, ListOfParameters}}, NewParameter) ->
	{apply, {AST, [NewParameter] ++ ListOfParameters}};
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
%% getArity :: AST -> Number
%% 		takes a function, lambda, or apply
%%		

getArity({function, {_Name, Arity}}) -> Arity;
getArity({lambda, {NumVars, _AST}}) -> NumVars;
getArity({apply, { AST , Parameters}}) -> getArity(AST) - length(Parameters).

%% 
%% type :: AST -> Atom
%% 		
%%		

type({Type, _Data}) ->
	Type.
	
%% 
%% apply :: AST -> AST -> AST
%% 		takes care of apply for everyone
%%		

% things that get applied:
% 		(a -> b) Param1
% 		functionName Param1
%		(functionName Param1) Param2
% apply({function, {{Name, Val}, 1}}, AST) ->
% 	% call Name with Val and get back a new function
% 	todo.
% apply({function, {Name, 1}}, AST) ->
% 	erlang:apply(primFuncs, Name, [AST]);
% apply({function, _ASTData} = Function, AST) ->
% 	makeApply(Function, [AST]);
% apply({apply, { {function, {, Arity}} }})
% 
% apply(Function, ListOfParameters) ->
% 	erlang:apply(primFuncs, Function, lists:reverse(ListOfParameters));


% apply({function, {Name, 1}}, AST) when is_atom(Name) ->
% 	erlang:apply(primFuncs, Name, [AST]);
% 
% apply({function, _ASTData} = Function, AST) ->
% 	makeApply(Function, [AST]);

apply(Function, AST) ->
	Arity = getArity(Function),
	ok.
	
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
%% mapStrings :: AST (with Strings) -> (String -> AST) -> AST (without Strings)
%% 
%%
	
mapStrings(String, MapFunction) when is_list(String) ->
	MapFunction(String);
mapStrings({lambda, {Num, AST}}, MapFunction) ->
	makeLambda(
		mapStrings(AST, MapFunction),
		Num
	);
mapStrings({apply, {AST, ListOfParameters}}, MapFunction) ->
	makeApply(
		mapStrings(AST, MapFunction),
		lists:map(fun(Elem) ->
			mapStrings(Elem, MapFunction)
		end, ListOfParameters)
	);
mapStrings(AST, _) ->
	AST.
