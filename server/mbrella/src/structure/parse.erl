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

%% 
%% parse:: String (deBruijn style) -> Scope -> AST
%%

parse([$(|Right] = S, Scope) ->
	%apply or lambda
	case Right of
		[$\\|Rest] ->
			%lambda
			{Expr, [$)|Remaining]} = parse(Rest, Scope),
			{ast:makeLambda(Expr), Remaining};
		_ ->
			%apply
			{ApplyLeft, SpaceAndRight} = parse(Right, Scope),
			[$ |Rest] = SpaceAndRight,
			{ApplyRight, [$)|Remaining]} = parse(Rest, Scope),
			{ast:makeApply(ApplyRight, ApplyRight), Remaining}
	end;
parse([$\"|Right] = S, _) ->
	%quoted string
	cutOffRightQuote(Right);
parse([$ |Right] = S, Scope) ->
	%not sure if this will happen
	parse(Right, Scope);
parse([$/|Right] = S, _) ->
	{NumString, Rest} = untilSpaceOrRightParen(Right),
	Num = list_to_integer(NumString),
	{ast:makeVariable(Num), Rest};
parse([_|Right] = S, Scope) ->
	%env variable or number
	%read until space or right paren
	{VarOrPrim, Rest} = untilSpaceOrRightParen(S),
	Ans = case extractPrim(VarOrPrim) of
		error ->
			case scope:lookup(Scope, VarOrPrim) of
				notfound ->
					globalStore:lookupPointer(VarOrPrim);
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
	ast:fold(fun(InnerAST, String) ->
		case ast:type(InnerAST) of
			apply ->
				"(" ++ String ++ ")";
			lambda ->
				Num = ast:getLambdaNumber(InnerAST),
				Slashes = lists:duplicate(Num, $\\),
				"(" ++ Slashes ++ " " ++ String ++ ")";
			string ->
				ast:getString(InnerAST) ++ " " ++ String;
			number ->
				NumberString = case ast:getNumber(InnerAST) of
					Integer when is_integer(Integer) -> integer_to_list(Integer);
					Float when is_float(Float) -> float_to_list(Float)
				end,
				NumberString ++ " " ++ String;
			bool ->
				atom_to_list(ast:getBool(InnerAST)) ++ " " ++ String;
			null ->
				atom_to_list(ast:getNull(InnerAST)) ++ " " ++ String;
			variable ->
				"/" ++ integer_to_list(ast:getVariable(InnerAST)) ++ " " ++ String;
			cell ->
				ast:getCellName(InnerAST) ++ " " ++ String;
			function ->
				ast:getFunctionName(InnerAST) ++ " " ++ String
		end
	end, "", AST).



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
untilSpaceOrRightParen([$ |R] = S) ->
	{[], S};
untilSpaceOrRightParen([$)|R] = S) ->
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

