-module (parse).

-include ("../../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-export([parse/1, parse/2, unparse/1]).

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

parse(S, Scope) ->
	{Result, _} = parser(S, empty, Scope),
	Result.


%% 
%% parser:: String (deBruijn style) -> Scope -> {AST, String}
%%


parser(String, LeftAST, Scope) ->
	{AST, Remaining} = case String of
		[$(|Right] ->
			{ParsedAST, [$)|Rest]} = parser(trimSpace(Right), empty, Scope),
			{ParsedAST, trimSpace(Rest)};
		[$\\|Right] ->
			{ParsedAST, Rest} = parser(trimSpace(Right), empty, Scope),
			{ast:makeLambda(ParsedAST), Rest};
		[$/|Right] ->
			{NumString, Rest} = untilSpaceOrRightParen(Right),
			Num = list_to_integer(NumString),
			{ast:makeVariable(Num), Rest};
		[$\"|Right] ->
			%quoted string
			cutOffRightQuote(Right);
		_ -> %string
			{VarOrPrim, Rest} = untilSpaceOrRightParen(String),
			Ans = case extractPrim(VarOrPrim) of
				error ->
					case functionTable:lookup(VarOrPrim) of
						notfound -> 
							case scope:lookup(Scope, VarOrPrim) of
								notfound ->
									globalStore:lookupPointer(VarOrPrim);
								Found -> Found
							end;
						Found -> Found
					end;
				Prim ->
					ast:makeLiteral(Prim)
			end,
			{Ans, Rest}
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

cutOffRightQuote([$\"|R]) ->
	{[], R};
cutOffRightQuote([L|R]) ->
	{Ans, Rest} = cutOffRightQuote(R),
	{[L|Ans], Rest}.

untilSpaceOrRightParen([]) ->
	{[], []};
untilSpaceOrRightParen([$ |_] = S) ->
	{[], trimSpace(S)};
untilSpaceOrRightParen([$)|_] = S) ->
	{[], trimSpace(S)};
untilSpaceOrRightParen([L|R]) ->
	{Ans, Rest} = untilSpaceOrRightParen(R),
	{[L|Ans], Rest}.

trimSpace([$ |Rest]) -> trimSpace(Rest);
trimSpace(S) ->	S.

extractPrim(VarOrPrim) ->
	case VarOrPrim of
		"null" -> null;
		"true" -> true;
		"false" -> false;
		_ ->
			try list_to_integer(VarOrPrim)
			catch _:_ ->
				try list_to_float(VarOrPrim)
				catch _:_ ->
					error
				end
			end
	end.

