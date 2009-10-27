-module (parse).

-include ("../../include/scaffold.hrl").

-define( colortrace(X), io:format("\033[40mTRACE \033[31m~p\033[39m:\033[95m~p\033[39m ~p\033[0m~n~n", [?MODULE, ?LINE, X])).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-export([parse/1, parse/2, bind/1, bind/2, unparse/1]).

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% 
%% parse:: String (deBruijn style) -> AST
%%

parse(S) ->
	parse(S, scope:makeScope()).

%% 
%% parse:: String (deBruijn style) -> Scope -> AST
%%

parse(S, Scope) ->
	{Result, _} = parser(S, empty, Scope),
	Result.


%% 
%% parser:: String (deBruijn style) -> Scope -> {AST, String}
%%


parser(String, LeftAST, Scope) ->
	{AST, Remaining} = case String of
		[$(|Right] ->
			{ParsedAST, [$)|Rest]} = parser(parseUtil:trimSpace(Right), empty, Scope),
			{ParsedAST, parseUtil:trimSpace(Rest)};
		[$\\|Right] ->
			{ParsedAST, Rest} = parser(parseUtil:trimSpace(Right), empty, Scope),
			{ast:makeLambda(ParsedAST), Rest};
		[$/|Right] ->
			{NumString, Rest} = parseUtil:untilSpaceOrRightParen(Right),
			Num = list_to_integer(NumString),
			{ast:makeVariable(Num), Rest};
		[$\"|Right] ->
			%quoted string
			parseUtil:cutOffRightQuote(Right);
		_ -> %string
			{StringToParse, Rest} = parseUtil:untilSpaceOrRightParen(String),
			ParsedString = case parseUtil:extractPrim(StringToParse) of
				error ->
					parseString(StringToParse, Scope);
				Prim ->
					ast:makeLiteral(Prim)
			end,
			{ParsedString, Rest}
	end,
	NewAST = case LeftAST of
		empty -> AST;
		_ -> ast:makeApply(LeftAST, AST)
	end,
	case Remaining of
		[] -> {NewAST, []};
		[$)|_] -> {NewAST, Remaining};
		_ -> parser(Remaining, NewAST, Scope)
	end.


%% 
%% bind:: AST (without pointers) -> AST (with pointers)
%%

bind(AST) ->
	bind(AST, scope:makeScope()).

%% 
%% bind:: AST (without pointers) -> Scope -> AST (with pointers)
%%

bind(AST, Scope) ->
	ast:mapType(unboundVariable, AST, fun(String) -> 
		parseString(String, Scope)
	end).


%% 
%% unparse:: AST -> String
%% 

unparse(AST) ->
	case ast:type(AST) of
		apply ->
			UnparsedFunction = unparse(ast:getApplyFunction(AST)),
			UnparsedParameters = lists:map(fun unparse/1, ast:getApplyParameters(AST)),
			"(" ++ string:join([UnparsedFunction | UnparsedParameters], " ") ++ ")";
		lambda ->
			Num = ast:getArity(AST),
			StartSlashes = lists:flatten(lists:duplicate(Num, "(\\")),
			EndSlashes = lists:flatten(lists:duplicate(Num, ")")),
			ASTString = unparse(ast:getLambdaAST(AST)),
			StartSlashes ++ " " ++ ASTString ++ EndSlashes;
		string ->
			ast:getString(AST);
		number ->
			NumberString = case ast:getNumber(AST) of
				Integer when is_integer(Integer) -> integer_to_list(Integer);
				Float when is_float(Float) -> float_to_list(Float)
			end,
			NumberString;
		bool ->
			atom_to_list(ast:getBool(AST));
		null ->
			atom_to_list(ast:getNull(AST));
		variable ->
			"/" ++ integer_to_list(ast:getVariable(AST));
		cell ->
			ast:getCellName(AST);
		function ->
			atom_to_list(ast:getFunctionName(AST))
	end.



%% ====================================================
%% Internal Functions
%% ====================================================





parseString(String, Scope) ->
	case scope:lookup(Scope, String) of
		notfound -> 
			case functionTable:lookup(String) of
				notfound ->
					% TODO: should only lookup if the word starts with cell or object or whatever... throw error otherwise
					% TODO: remove the following (added case statement for debugging)
					case String of
						"cell." ++ _ ->
							case cellStore:lookup(String) of
								notfound ->
									throw({bad_cell_name, String});
								CellPointer ->
									ast:makeCell(CellPointer)						
							end;
						"object." ++ _ ->
							ast:makeObject(String)
							% case objectStore:lookup(String) of
							% 	notfound ->
							% 		throw({bad_object_name, String});
							% 	_Object ->
							% 		% ast:makeObject(Object)
							% 		ast:makeObject(String)
							% end
					end;
				Found -> Found
			end;
		Found -> Found
	end.


