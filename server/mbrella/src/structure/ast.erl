-module(ast).

-compile( export_all ).

%% ====================================================
%% TYPES
%% ====================================================

% Literal	 	:: String | Number | Bool | Null
% Null			:: Atom
% String 		:: List
% Bool			:: Atom
% AST			:: Tuple Atom ASTData
% ASTData		:: Literal | Tuple 
% 				ie 		{CellPointer, BottomExpr} | {Atom, Number} | {AST, List}
% CellPointer 	:: Tuple String Pid

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
%% makeLambda :: AST -> AST
%% 		
%%		

makeLambda(AST) ->
	{lambda, {1, AST}}.

%% 
%% makeLambda :: AST -> Number -> AST
%% 		
%%		

makeLambda(AST, NumOfVariables) ->
	{lambda, {NumOfVariables, AST}}.

%% 
%% makeApply :: AST -> List a -> AST
%% 		
%%		

makeApply(AST, ListOfParameters) ->
	{apply, {AST, ListOfParameters}}.

%% 
%% type :: AST -> Atom
%% 		
%%		

type({Type, _Data}) ->
	Type.