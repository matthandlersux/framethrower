%% @andrew dailey <adailey14@gmail.com>
%% @copyright 2009 worldmerge.

%% @doc Utilities to handle server advice requests.

-module(serverAdvice).
-author('andrew dailey <adailey14@gmail.com>').

-include ("../../mbrella/v1.4/include/scaffold.hrl").

-export([processServerAdvice/3]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-record (templateWithScope, {
	struct,
	scope = dict:new()
}).

processServerAdvice(ServerAdviceRequest, Templates, From) ->
	spawn(fun() ->
		processCall(ServerAdviceRequest, Templates, dict:new(), From)
	end).

%% ====================================================================
%% Internal functions
%% ====================================================================
processCall (Call, Templates, Scope, SessionPid) ->
	case struct:get_first(Call) of
		{<<"thunk">>, Thunk} -> processThunk(Thunk, Templates, Scope, SessionPid);
		{<<"forEach">>, ForEach} -> processForEach(ForEach, Templates, Scope, SessionPid);
		{<<"pattern">>, Pattern} -> processPattern(Pattern, Templates, Scope, SessionPid)
	end.

runTemplate (Template, Params, Templates, Scope, SessionPid) ->
	%TODO: may want to check that param names agree with expected names in template
		
	%build scope with params
	ScopeWithParams = lists:foldr(fun(Param, AccScope) ->
		PName = getFromStruct("name", Param),
		PValue = getFromStruct("value", Param),

		case PValue of
			undefined -> dict:erase(PName, AccScope);
			_ -> dict:store(PName, PValue, AccScope)
		end
	end, Scope, Params),
	
	Derives = getFromStruct("derives", Template),
	%parse derives, updating the scope with each derive
	ScopeWithDerives = lists:foldr(fun(Derive, AccScope) ->
		DName = getFromStruct("name", Derive),
		DExpr = getFromStruct("value", Derive),
		%TODO: here we need to evaluate and send every derive to the client
				
		
		try expr:exprParse(DExpr, AccScope) of
			DParsed -> 
				case eval:evaluate( DParsed ) of
					Cell when is_record(Cell, exprCell) ->
						QueryId = session:getQueryId(SessionPid),
						case session:queryDefine(SessionPid, expr:unparse(DParsed), QueryId) of
							true ->
								OnRemove = cell:injectFunc(Cell, 
									fun() ->
										session:sendUpdate(SessionPid, {done, QueryId})
									end,
									fun(Val) ->
										session:sendUpdate(SessionPid, {data, {QueryId, add, Val}}),
										fun() -> 
											case Val of
												{Key,_} -> session:sendUpdate(SessionPid, {data, {QueryId, remove, Key}});
												_ -> session:sendUpdate(SessionPid, {data, {QueryId, remove, Val}})
											end
										end
									end
								),
								session:addCleanup(SessionPid, QueryId, OnRemove);
							false -> nosideeffect
						end;
					_ ->
						nosideeffect
				end,
				dict:store(DName, DParsed, AccScope)
		catch _:_ ->
			dict:erase(DName, AccScope),
			AccScope
		end
	end, ScopeWithParams, Derives),
	
	ContainedTemplates = getFromStruct("templates", Template),
	UpdatedTemplates = lists:foldr(fun(ContainedTemplate, AccTemplates) ->
		TName = getFromStruct("name", ContainedTemplate),
		TValue = getFromStruct("value", ContainedTemplate),
		TemplateWithScope = #templateWithScope{struct = TValue, scope=ScopeWithDerives},
		dict:store(TName, TemplateWithScope, AccTemplates)
	end, Templates, ContainedTemplates),
	
	Calls = getFromStruct("calls", Template),
	
	lists:foreach(fun(Call) ->
		processCall(Call, UpdatedTemplates, ScopeWithDerives, SessionPid)
	end, Calls).

processThunk (Thunk, Templates, Scope, SessionPid) ->
	TemplateName = getFromStruct("template", Thunk),
	
	Params = getFromStruct("params", Thunk),
	
	ParamExprs = lists:map(fun(Param) ->
		PValue = getFromStruct("value", Param),
	
		PParsed = try expr:exprParse(PValue, Scope)
			catch _:_ -> undefined
		end,

		struct:set_value(<<"value">>, PParsed, Param)
	end, Params),
	
	case dict:find(TemplateName, Templates) of
		{ok, TemplateWithScope} when is_record(TemplateWithScope, templateWithScope) ->
			runTemplate(TemplateWithScope#templateWithScope.struct, ParamExprs, Templates, TemplateWithScope#templateWithScope.scope, SessionPid);
		{ok, Template} -> runTemplate(Template, ParamExprs, Templates, dict:new(), SessionPid);
		_ -> nosideeffect
	end.
	
processForEach (ForEach, Templates, Scope, SessionPid) ->
	On = getFromStruct("on", ForEach),
	KeyName = getFromStruct("key", ForEach),
	ValName = getFromStruct("value", ForEach),
	Block = getFromStruct("block", ForEach),
	case dict:find(On, Scope) of
		{ok, OnExpr} -> 
			Cell = eval:evaluate(OnExpr),
			DoneResponse = fun() -> nosideeffect end,
			UpdateFun = fun (Update) ->
				NewScope = case Update of
					{Key, Val} ->
						KeyScope = dict:store(KeyName, Key, Scope),
						dict:store(ValName, Val, KeyScope);
					Key ->
						dict:store(KeyName, Key, Scope)
				end,
				lists:foreach(fun(Call) ->
					processCall(Call, Templates, NewScope, SessionPid)
				end, Block),
				fun() ->
					%TODO
					undosideeffect
				end
			end,
			cell:injectFunc(Cell, DoneResponse, UpdateFun);
		_ -> nosideeffect
	end.
	
processPattern (Pattern, Templates, Scope, SessionPid) ->
	
	
	MatchList = lists:reverse(Pattern),
	
	MatchCell = (cell:makeCellMapInput())#exprCell{type = type:parse("Map Number (Unit a)")},
	cell:update(MatchCell),
	
	DefaultCell = (cell:makeCell())#exprCell{type = type:parse("Unit a")},
	
	lists:foldr(fun(Match, Index) ->
		MatchVar = getFromStruct("match", Match),
		case MatchVar of
			undefined -> cell:addLine(MatchCell, {Index, DefaultCell});
			_ ->
				case dict:find(MatchVar, Scope) of
					{ok, MatchExpr} -> 
						Cell = eval:evaluate(MatchExpr),
						cell:addLine(MatchCell, {Index, Cell});
					_ -> nosideeffect
				end
		end,
		Index+1
	end, 0, MatchList),
	
	GetFirstExpr = expr:exprParse("theMap -> bindMap returnUnitMap (bindMap returnUnitMap (buildMap (swap getKey theMap) (returnUnitSet (takeLast (keys (bindMap returnUnitMap theMap))))))"),
	GetFirstCell = eval:evaluate({cons, apply, GetFirstExpr, MatchCell}),
	
	%TODO:add some value for the default cell
	cell:addLine(DefaultCell, null),
	
	DoneResponse = fun() -> nosideeffect end,
	UpdateFun = fun ({Index, Val}) ->
		Match = lists:nth(Index+1, Pattern),
		Block = getFromStruct("block", Match),
		As = getFromStruct("as", Match),
		NewScope = case As of
			undefined -> Scope;
			_ -> 
				dict:store(As, Val, Scope)
		end,
		lists:foreach(fun(Call) ->
			processCall(Call, Templates, NewScope, SessionPid)
		end, Block),
		fun() ->
			%TODO
			undosideeffect
		end
	end,
	cell:injectFunc(GetFirstCell, DoneResponse, UpdateFun).


%Utility
getFromStruct(StringKey, Struct) ->
	Result = struct:get_value(list_to_binary(StringKey), Struct),
	if
		is_binary(Result) -> binary_to_list(Result);
		true -> Result
	end.
