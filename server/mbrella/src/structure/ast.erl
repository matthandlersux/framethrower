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
%% makeFunction :: Atom -> AST
%% 		
%%		

makeFunction(Name) ->
	Arity = erlang:apply(primFuncs, Name, []),
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
%% makeApply :: AST -> List a -> AST
%% 		
%%		

makeApply({apply, {AST, ListOfParameters}}, NewParameters) ->
	{apply, {AST, NewParameters ++ ListOfParameters}};
makeApply(AST, ListOfParameters) ->
	{apply, {AST, ListOfParameters}}.


%% Getter (Accessor) Functions

% helper
getFlatValue({_, Value}) -> Value.

getString(Input) -> getFlatValue(Input).
getNumber(Input) -> getFlatValue(Input).
getBool(Input) -> getFlatValue(Input).
getNull(Input) -> getFlatValue(Input).
getVariable(Input) -> getFlatValue(Input).
getCellName({_, {{Name, _}, _}}) -> Name.
getCellPid({_, {{_, Pid}, _}}) -> Pid.
getFunctionName({_, {Name, _}}) -> Name.
getFunctionArity({_, {_, Arity}}) -> Arity.

getLambdaNumber({_, NumOfVariables, _}) -> NumOfVariables.
getLambdaAST({_, {_, AST}}) -> AST.

getApplyFunction({_, {AST, _}}) -> AST.
getApplyParameters({_, {_, ListOfParameters}}) -> ListOfParameters.

%% 
%% getArity :: AST -> Number
%% 		takes a function lambda or apply
%%		

getArity({function, {_Name, Arity}}) -> Arity;
getArity({apply, { {function, {_Name, Arity}} , Parameters}}) -> Arity - Parameters;
getArity({apply, { {lambda, {NumVars, _AST}}, Parameters}}) -> NumVars - Parameters;
getArity({lambda, {NumVars, _AST}}) -> NumVars.

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
	
	
	
%% 
%% fold :: AST -> b -> (AST -> b -> b) -> b
%% 
%%

fold(FoldFunction, Accum, {lambda, {_, AST}} = Lambda) ->
	FoldFunction(Lambda, fold(FoldFunction, Accum, AST));
fold(FoldFunction, Accum, {apply, {AST, ListOfParameters}} = Apply) ->
	ListAccum = lists:fold(fun(Elem, InnerAccum) ->
		fold(FoldFunction, InnerAccum, Elem)
	end, ListOfParameters),
	FoldFunction(Apply, fold(FoldFunction, ListAccum, AST));
fold(FoldFunction, Accum, AST) ->
	FoldFunction(AST, Accum).