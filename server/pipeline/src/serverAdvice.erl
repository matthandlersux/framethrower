%% @andrew dailey <adailey14@gmail.com>
%% @copyright 2009 worldmerge.

%% @doc Utilities to handle server advice requests.

-module(serverAdvice).
-author('andrew dailey <adailey14@gmail.com>').

-include ("../../mbrella/include/scaffold.hrl").

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
		processCall(ServerAdviceRequest, Templates, dict:new(), OrderPid, DoneCell, 0, top),
		cell:done(TriggerCell),
		cell:injectFunc(DoneCell, fun() -> 
			OrderPid ! {close, self()},
			receive
				{closedState, State} -> 
					case dict:fetch_keys(State) of
						[] -> nosideeffect;
						Keys ->
							Sorted = lists:sort(Keys),
							lists:foreach(fun(Key) ->
								Messages = dict:fetch(Key, State),
								lists:foreach(fun(Message) -> processMessage(Message, SessionPid) end, Messages)
							end, Sorted)
					end
			end,
			session:serverAdviceDone(SessionPid) 
		end, NoFun)
	end).


processMessage(Message, SessionPid) ->
	session:sendUpdate(SessionPid, Message).

orderLoop(State, SessionPid) ->
	receive
		{queryDefine, ExprString, Depth, From} ->
			QueryId = session:getQueryId(SessionPid),
			Success = session:queryDefine(SessionPid, ExprString, QueryId),
			From ! {queryDefineResponse, Success, QueryId},
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
		{close, Pid} ->
			Pid ! {closedState, State},
			maintainLoop(SessionPid);
		Other ->
			?trace("GOT Other in Order Loop"),
			?trace(Other),
			orderLoop(State, SessionPid)
	end.


maintainLoop(SessionPid) ->
	receive
		{queryDefine, ExprString, _, From} ->
			QueryId = session:getQueryId(SessionPid),
			Success = session:queryDefine(SessionPid, ExprString, QueryId),
			From ! {queryDefineResponse, Success, QueryId},
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
			maintainLoop(SessionPid);
		{close, Pid} ->
			Pid ! {closedState, dict:new()},
			maintainLoop(SessionPid);
		Other ->
			?trace("GOT OTHER!!!"),
			?trace(Other),
			maintainLoop(SessionPid)
	end.

queryDefine(OrderPid, ExprString, Depth) ->
	OrderPid ! {queryDefine, ExprString, Depth, self()},
	receive
		{queryDefineResponse, Success, QueryId} -> {Success, QueryId}
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
					Cell when is_record(Cell, cellPointer) ->
						cell:injectFunc(Cell, DoneCell, fun(_) -> nosideeffect end),
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
								);
								%addCleanup(OrderPid, QueryId, OnRemove);
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
		processCall(Call, UpdatedTemplates, ScopeWithDerives, OrderPid, DoneCell, Depth, runTemplate)
	end, Calls).


processCall (Call, Templates, Scope, OrderPid, DoneCell, Depth, From) ->
	NewDepth = Depth + 1,
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
					{pair, Key, Val} ->
						KeyScope = dict:store(KeyName, Key, Scope),
						dict:store(ValName, Val, KeyScope);
					Key ->
						dict:store(KeyName, Key, Scope)
				end,
				lists:foreach(fun(Call) ->
					processCall(Call, Templates, NewScope, OrderPid, DoneCell, Depth, forEach)
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
	
	MatchCell = cell:makeCell(),
	cell:done(MatchCell),
	% #exprCell{type = type:parse("Map Number (Unit a)")},
	% cell:update(MatchCell),
	
	DefaultCell = cell:makeCell(),
	% #exprCell{type = type:parse("Unit a")},
	% cell:update(DefaultCell),
	cell:addLine(DefaultCell, null),
	cell:done(DefaultCell),
	
	lists:foldr(fun(Match, Index) ->
		MatchVar = getFromStruct("match", Match),
		case MatchVar of
			undefined -> cell:addLine(MatchCell, {pair, Index, DefaultCell});
			_ ->
				case dict:find(MatchVar, Scope) of
					{ok, MatchExpr} -> 
						Cell = eval:evaluate(MatchExpr),
						cell:addLine(MatchCell, {pair, Index, Cell}),
						cell:injectFunc(Cell, MatchCell, fun(_) -> nosideeffect end);
					_ -> nosideeffect
				end
		end,
		Index+1
	end, 0, MatchList),
	
	GetFirstExpr = expr:exprParse("theMap -> bindMap returnUnitMap (bindMap returnUnitMap (buildMap (swap getKey theMap) (returnUnitSet (takeLast (keys (bindMap returnUnitMap theMap))))))"),
	GetFirstCell = eval:evaluate({cons, apply, GetFirstExpr, MatchCell}),
	
	UpdateFun = fun ({pair, Index, Val}) ->
		Match = lists:nth(Index+1, Pattern),
		Block = getFromStruct("block", Match),
		As = getFromStruct("as", Match),
		NewScope = case As of
			undefined -> Scope;
			_ -> 
				dict:store(As, Val, Scope)
		end,
		lists:foreach(fun(Call) ->
			processCall(Call, Templates, NewScope, OrderPid, DoneCell, Depth, pattern)
		end, Block),
		fun() ->
			%TODO
			undosideeffect
		end
	end,
	cell:injectFunc(GetFirstCell, DoneCell, UpdateFun).


%Utility

checkForInnerCell(OrderPid, {pair, KeyToCheck, ValToCheck}, Depth) ->
	checkForInnerCell(OrderPid, KeyToCheck, Depth),
	checkForInnerCell(OrderPid, ValToCheck, Depth);
checkForInnerCell(OrderPid, ValToCheck, Depth) ->
	case ValToCheck of
		ValCell when is_record(ValCell, cellPointer) ->
			case queryDefine(OrderPid, ValCell#cellPointer.name, Depth) of
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
