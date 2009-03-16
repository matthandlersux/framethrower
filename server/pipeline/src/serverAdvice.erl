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

processServerAdvice(ServerAdviceRequest, Templates, SessionPid) ->
	spawn(fun() ->
		DoneCell = cell:makeCell(),
		TriggerCell = cell:makeCell(),
		NoFun = fun(_) -> nosideeffect end,
		cell:injectFunc(TriggerCell, DoneCell, NoFun),
		
		OrderPid = spawn(fun() -> orderLoop(dict:new(), SessionPid) end),
		processCall(ServerAdviceRequest, Templates, dict:new(), OrderPid, DoneCell, 0),
		cell:done(TriggerCell),
		cell:injectFunc(DoneCell, fun() -> 
			OrderPid ! {close, self()},
			receive
				State -> processOrderState(State, SessionPid, 1)
			end,
			session:serverAdviceDone(SessionPid) 
		end, NoFun)
	end).


processOrderState(State, SessionPid, Depth) ->
	?trace(State),
	case dict:find(Depth, State) of
		{ok, Messages} ->
			?trace(Messages),
			lists:foreach(fun(Message) -> processMessage(Message, SessionPid) end, Messages),
			processOrderState(State, SessionPid, Depth + 1);
		_ -> nosideeffect
	end.

processMessage(Message, SessionPid) ->
	?trace(Message),
	session:sendUpdate(SessionPid, Message).

orderLoop(State, SessionPid) ->
	receive
		{newDepth, Depth} ->
			NewState = dict:store(Depth, [], State),
			orderLoop(NewState, SessionPid);
		{queryDefine, ExprString, Depth, From} ->
			QueryId = session:getQueryId(SessionPid),			
			Success = session:queryDefine(SessionPid, ExprString, QueryId),
			From ! {Success, QueryId},
			NewState = case Success of
				true -> dict:append(Depth, {queryDefine, ExprString, QueryId}, State);
				false -> State
			end,
			orderLoop(NewState, SessionPid);
		{update, Update, Depth} ->
			NewState = dict:append(Depth, Update, State),
			orderLoop(NewState, SessionPid);
		{addCleanup, QueryId, OnRemove} ->
			session:addCleanup(SessionPid, QueryId, OnRemove),
			orderLoop(State, SessionPid);
		{close, From} ->
			From ! State,
			maintainLoop(SessionPid)
	end.


maintainLoop(SessionPid) ->
	receive
		{queryDefine, ExprString, _, From} ->
			QueryId = session:getQueryId(SessionPid),
			Success = session:queryDefine(SessionPid, ExprString, QueryId),
			From ! {Success, QueryId},
			case Success of
				true -> processMessage({queryDefine, ExprString, QueryId}, SessionPid);
				false -> nosideeffect
			end,
			maintainLoop(SessionPid);
		{update, Update, _} ->
			processMessage(Update, SessionPid),
			maintainLoop(SessionPid);
		{addCleanup, QueryId, OnRemove} ->
			session:addCleanup(SessionPid, QueryId, OnRemove),
			maintainLoop(SessionPid)
	end.

queryDefine(OrderPid, ExprString, Depth) -> 
	OrderPid ! {queryDefine, ExprString, Depth, self()},
	receive
		Response -> Response
	end.

sendUpdate(OrderPid, Update, Depth) ->
	OrderPid ! {update, Update, Depth}.

addCleanup(OrderPid, QueryId, OnRemove) ->
	OrderPid ! {addCleanup, QueryId, OnRemove}.

%% ====================================================================
%% Internal functions
%% ====================================================================

runTemplate (Template, Params, Templates, Scope, OrderPid, DoneCell, Depth) ->
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
						case queryDefine(OrderPid, expr:unparse(DParsed), Depth) of
							{true, QueryId} ->
								OnRemove = cell:injectFunc(Cell, 
									fun() ->
										sendUpdate(OrderPid, {done, QueryId}, Depth)
									end,
									fun(Val) ->
										sendUpdate(OrderPid, {data, {QueryId, add, Val}}, Depth),
										checkForInnerCell(OrderPid, Val, Depth),
										fun() -> 
											case Val of
												{Key,_} -> sendUpdate(OrderPid, {data, {QueryId, remove, Key}}, Depth);
												_ -> sendUpdate(OrderPid, {data, {QueryId, remove, Val}}, Depth)
											end
										end
									end
								),
								addCleanup(OrderPid, QueryId, OnRemove);
							_ -> nosideeffect
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
		processCall(Call, UpdatedTemplates, ScopeWithDerives, OrderPid, DoneCell, Depth)
	end, Calls).


processCall (Call, Templates, Scope, OrderPid, DoneCell, Depth) ->
	NewDepth = Depth + 1,
	OrderPid ! {newDepth, NewDepth},
	case struct:get_first(Call) of
		{<<"thunk">>, Thunk} -> processThunk(Thunk, Templates, Scope, OrderPid, DoneCell, NewDepth);
		{<<"forEach">>, ForEach} -> processForEach(ForEach, Templates, Scope, OrderPid, DoneCell, NewDepth);
		{<<"pattern">>, Pattern} -> processPattern(Pattern, Templates, Scope, OrderPid, DoneCell, NewDepth)
	end.

processThunk (Thunk, Templates, Scope, OrderPid, DoneCell, Depth) ->
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
			runTemplate(TemplateWithScope#templateWithScope.struct, ParamExprs, Templates, TemplateWithScope#templateWithScope.scope, OrderPid, DoneCell, Depth);
		{ok, Template} -> runTemplate(Template, ParamExprs, Templates, dict:new(), OrderPid, DoneCell, Depth);
		_ -> nosideeffect
	end.
	
processForEach (ForEach, Templates, Scope, OrderPid, DoneCell, Depth) ->
	On = getFromStruct("on", ForEach),
	KeyName = getFromStruct("key", ForEach),
	ValName = getFromStruct("value", ForEach),
	Block = getFromStruct("block", ForEach),
	case dict:find(On, Scope) of
		{ok, OnExpr} -> 
			Cell = eval:evaluate(OnExpr),
			UpdateFun = fun (Update) ->
				NewScope = case Update of
					{Key, Val} ->
						KeyScope = dict:store(KeyName, Key, Scope),
						dict:store(ValName, Val, KeyScope);
					Key ->
						dict:store(KeyName, Key, Scope)
				end,
				lists:foreach(fun(Call) ->
					processCall(Call, Templates, NewScope, OrderPid, DoneCell, Depth)
				end, Block),
				fun() ->
					%TODO
					undosideeffect
				end
			end,
			cell:injectFunc(Cell, DoneCell, UpdateFun);
		_ -> nosideeffect
	end.
	
processPattern (Pattern, Templates, Scope, OrderPid, DoneCell, Depth) ->
	MatchList = lists:reverse(Pattern),
	
	MatchCell = (cell:makeCellMapInput())#exprCell{type = type:parse("Map Number (Unit a)")},
	cell:update(MatchCell),
	
	DefaultCell = (cell:makeCell())#exprCell{type = type:parse("Unit a")},
	cell:done(DefaultCell),
	
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
	cell:done(MatchCell),
	
	GetFirstExpr = expr:exprParse("theMap -> bindMap returnUnitMap (bindMap returnUnitMap (buildMap (swap getKey theMap) (returnUnitSet (takeLast (keys (bindMap returnUnitMap theMap))))))"),
	GetFirstCell = eval:evaluate({cons, apply, GetFirstExpr, MatchCell}),
	
	%TODO:add some value for the default cell
	cell:addLine(DefaultCell, null),
	
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
			processCall(Call, Templates, NewScope, OrderPid, DoneCell, Depth)
		end, Block),
		fun() ->
			%TODO
			undosideeffect
		end
	end,
	cell:injectFunc(GetFirstCell, DoneCell, UpdateFun).


%Utility

checkForInnerCell(OrderPid, {KeyToCheck, ValToCheck}, Depth) ->
	checkForInnerCell(OrderPid, KeyToCheck, Depth),
	checkForInnerCell(OrderPid, ValToCheck, Depth);
checkForInnerCell(OrderPid, ValToCheck, Depth) ->
	case ValToCheck of
		ValCell when is_record(ValCell, exprCell) ->
			case queryDefine(OrderPid, ValCell#exprCell.name, Depth) of
				{true, QueryId} ->
					OnRemove = cell:injectFunc(ValCell, 
						fun() ->
							sendUpdate(OrderPid, {done, QueryId}, Depth)
						end,
						fun(Val) ->
							sendUpdate(OrderPid, {data, {QueryId, add, Val}}, Depth),
							checkForInnerCell(OrderPid, Val, Depth),
							fun() -> 
								case Val of
									{Key,_} -> sendUpdate(OrderPid, {data, {QueryId, remove, Key}}, Depth);
									_ -> sendUpdate(OrderPid, {data, {QueryId, remove, Val}}, Depth)
								end
							end
						end
					),
					addCleanup(OrderPid, QueryId, OnRemove);
				_ -> nosideeffect
			end;			
		_ -> nosideeffect
	end.



getFromStruct(StringKey, Struct) ->
	Result = struct:get_value(list_to_binary(StringKey), Struct),
	if
		is_binary(Result) -> binary_to_list(Result);
		true -> Result
	end.
