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
	{Result, _} = parser(S, Scope),
	Result.


%% 
%% parser:: String (deBruijn style) -> Scope -> {AST, String}
%%

parser([$(|Right], Scope) ->
	%apply or lambda
	case Right of
		[$\\|Rest] ->
			%lambda
			{Expr, [$)|Remaining]} = parser(Rest, Scope),
			{ast:makeLambda(Expr), Remaining};
		_ ->
			%apply
			{ApplyLeft, SpaceAndRight} = parser(Right, Scope),
			[$ |Rest] = SpaceAndRight,
			{ApplyRight, [$)|Remaining]} = parser(Rest, Scope),
			{ast:makeApply(ApplyLeft, ApplyRight), Remaining}
	end;
parser([$\"|Right], _) ->
	%quoted string
	cutOffRightQuote(Right);
parser([$ |Right], Scope) ->
	%not sure if this will happen
	parser(Right, Scope);
parser([$/|Right], _) ->
	{NumString, Rest} = untilSpaceOrRightParen(Right),
	Num = list_to_integer(NumString),
	{ast:makeVariable(Num), Rest};
parser(S, Scope) ->
	%env variable or number
	%read until space or right paren
	{VarOrPrim, Rest} = untilSpaceOrRightParen(S),
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
	{Ans, Rest}.



%% 
%% unparse:: AST -> String
%% 

unparse(AST) ->
	case ast:type(AST) of
		apply ->
			UnparsedFunction = unparse(ast:getApplyFunction(AST)),
			UnparsedParameters = lists:map(fun unparse/1, ast:getApplyParameters(AST)),
			string:join([UnparsedFunction | UnparsedParameters], " ");
		lambda ->
			Num = ast:getLambdaNumber(AST),
			Slashes = lists:duplicate(Num, $\\),
			ASTString = unparse(ast:getLambdaAST(AST)),
			"(" ++ Slashes ++ " " ++ ASTString ++ ")";
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
	{[], S};
untilSpaceOrRightParen([$)|_] = S) ->
	{[], S};
untilSpaceOrRightParen([L|R]) ->
	{Ans, Rest} = untilSpaceOrRightParen(R),
	{[L|Ans], Rest}.

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

