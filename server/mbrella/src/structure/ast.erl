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
getArity({apply, { AST , Parameters}}) -> getArity(Arity) - length(Parameters).

%% 
%% type :: AST -> Atom
%% 		
%%		

type({Type, _Data}) ->
	Type.
	
%% 
%% apply :: AST -> List AST -> AST | CellPointer | ObjectPointer | Literal ... etc...
%% 		takes care of apply for everyone
%%		

apply({function, {Accessor, _Arity}}, ListOfParameters) when is_tuple(Accessor) ->
	todo;
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
toTerm({function, _} = Function) ->
	Function;
toTerm({apply, _} = Apply) ->
	Apply;
toTerm({lambda, _} = Lambda) ->
	Lambda.