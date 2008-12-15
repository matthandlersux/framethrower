-module (expr).
-compile(export_all).

-include ("ast.hrl").

expr(AST) ->
	DefaultEnv = getEnv(default),
	expr(AST, DefaultEnv).

expr(AST, Env) when is_record(AST, cons) ->
	{cons, AST#cons.type, expr(AST#cons.left, Env), expr(AST#cons.right, Env)};
expr(AST, _) when AST =:= "true" orelse AST =:= "false" ->
	list_to_atom(AST);
expr(AST, Env) when is_list(AST) ->
	case is_string(AST) of
		true -> 
			case getFun(AST, Env) of
				{ok, {Type, Fun}} ->
					{exprFun, "fun", Type, AST, Fun};
				_ ->
					{exprVar, "var", AST}
			end;
		false ->
			exit(AST)
	end;
expr(AST, _) when is_number(AST) ->
	AST;
expr(AST, _) when is_boolean(AST) ->
	AST.



%% ====================================================
%% environment functions
%% ====================================================

getFun(Key, Env) ->
	try dict:fetch(Key, Env) of
		{Type, Fun} -> {ok, {Type, Fun}}
	catch
		_:_ -> false
	end.
		
getEnv(default) ->
	BuildEnv = fun({Name, TypeString, Fun}, {Suffix, Dict}) ->
					{Suffix + 1, dict:store(Name, {type:shiftVars( parse:tast(TypeString), integer_to_list(Suffix) ++ "v"), Fun}, Dict)}
				end,
	FunList = [
		% {"bindUnit", "type" , fun component:bindUnit/1},
		{"bindSet", "(a -> Set b) -> Set a -> Set b", fun component:bindSet/1},
		% {"compose", "f -> g -> x -> f (g x)", fun component:compose/1},
		% {"compose", "(b -> c) -> (a -> b) -> (a -> c)", fun component:compose/1},
		{"compose", "(a -> b) -> (c -> a) -> (c -> b)", fun component:compose/1},
		{"returnUnitSet", "Unit a -> Set a", fun component:returnUnitSet/1},
		{"passthru", "(a -> Bool) -> a -> Unit a", fun component:passthru/1},
		{"not", "Bool -> Bool", fun component:passthru/1}
		

	],
	{_, FinalDict} = lists:foldl( BuildEnv, {1, dict:new()}, FunList),
	FinalDict.
	

	
%% ====================================================
%% utilities
%% ====================================================

is_string(String) ->
	Pred = fun(Number) ->
				if 
					Number < 0 -> false;
					Number > 255 -> false;
					true -> true
				end
			end,
	lists:all(Pred, String).