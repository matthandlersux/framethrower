%% @author author <author@example.com>
%% @copyright YYYY author.

%% @doc Web server for pipeline.

-module(pipeline_web).
-author('author <author@example.com>').
-include ("../../mbrella/v1.4/include/scaffold.hrl").

-export([start/1, stop/0, loop/2, processActionList/1]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).
-define (pipelineBufferTime, 50).

%% External API

start(Options) ->
    {DocRoot, Options1} = get_option(docroot, Options),
    Loop = fun (Req) ->
                   ?MODULE:loop(Req, DocRoot)
           end,
    mochiweb_http:start([{name, ?MODULE}, {loop, Loop} | Options1]).

stop() ->
    mochiweb_http:stop(?MODULE).

loop(Req, DocRoot) ->
    "/" ++ Path = Req:get(path),
    case Req:get(method) of
        Method when Method =:= 'GET'; Method =:= 'HEAD' ->
            case Path of
				"newSession" ->
					SessionId = session:new(),
					spit(Req, "sessionId", SessionId);
				"test" ->
					% spit(Req, "test", list_to_binary(io_lib:format("~p", [catch erlang:error(test) ] )));
					spit(Req, {struct, [{<<"test">>, value}]});
				"debug" ->
					Data = Req:parse_qs(),
					Name = proplists:get_value("name", Data),
					if
						Name =:= undefined -> Req:ok({"text/html", [], [ debug:httpSearchPage() ]});
						true ->
							case debug:getDebugHTML(Name, "/debug?name=") of
								notfound ->
									Req:ok({"text/plain", [], [ Name ++ " was not found on the server." ] });
								HTML ->
									Req:ok({"text/html", [], [ "<html>" ++ HTML ++ "</html>"]})
							end
					end;
				"responseTimeSVG" ->
					Data = Req:parse_qs(),
					SessionId = proplists:get_value("sessionId", Data),
					if
						SessionId =:= undefined -> Req:ok({"text/html", [], [ responseTime:searchPage() ]});
						true ->
							case responseTime:get( SessionId ) of
								responseTime_off ->
									Req:ok({ "text/plain", [], [ "responseTime server is off" ] });
								[] ->
									Req:ok({ "text/plain", [], [ SessionId ++ " has no information." ] });
								String -> 
									Req:ok({ "image/svg+xml", [], [ String ] })
								% InOutList ->
								% 	Req:ok({ "text/plain", [], [ io_lib:format("~p", [InOutList]) ]})
							end
					end;
				"serialize" ->
					Data = Req:parse_qs(),
					{Username, Password} = mblib:pump(["username", "password"], 
												fun(Element) -> proplists:get_value(Element, Data) end),
					if 
						Username =:= "echostorm", Password =:= "build7twenty" ->
							try serialize:serializeEnv() of
								ok -> Req:ok({ "text/plain", [], [ "server state serialized successfully." ]})
							catch _:_ -> Req:ok({ "text/plain", [], [ "error, serialize screwed up (andrews fault)." ]})
							end;
						true ->
							Req:ok({ "text/plain", [], [ "invalid username/password." ]})
					end;
                _ ->
                    Req:serve_file(Path, DocRoot)
            end;
        'POST' ->
            case Path of
				"newSession" ->
					SessionId = sessionManager:newSession(),
					% responseTime:in(SessionId, newSession, now() ),
					% responseTime:out(SessionId, newSession, now() ),
					spit(Req, "sessionId", SessionId);
				"pipeline" ->
					Data = Req:parse_post(),
					Json = proplists:get_value("json", Data),
					JsonOut = try mochijson2:decode(Json) of Struct ->
						LastMessageId = struct:get_value(<<"lastMessageId">>, Struct),
						SessionId = struct:get_value(<<"sessionId">>, Struct),
						responseTime:in(SessionId, pipeline, null, now() ),
						case sessionManager:lookup(SessionId) of
							sessionClosed -> {struct, [{"sessionClosed", true}] };
							SessionPid ->
								case session:pipeline(SessionPid, LastMessageId) of
									timeout ->
										TimeoutError = {struct, [{"errorType", timeout}, {"reason", no_response_for_pipeline}]},
										{struct, [{"responses", [TimeoutError]},{"lastMessageId", LastMessageId}]};
									{updates, Updates, LastMessageId2} ->
										responseTime:updatesOut(SessionId, pipeline, Updates),
										{struct, [{"responses", Updates},{"lastMessageId", LastMessageId2}]};
									OtherJson -> OtherJson
								end
						end
					catch _:_ -> 
						?trace("Decode Error: "), ?trace(Json),
						DecodeError = {struct, [{"errorType", decodeError}, {"reason", bad_json}]},
						{struct, [{"responses", [DecodeError]}]}
					end,
					spit(Req, JsonOut);
				"post" ->
					Data = Req:parse_post(),
					Json = proplists:get_value("json", Data),
					Struct = mochijson2:decode(Json),
					SessionId = struct:get_value(<<"sessionId">>, Struct),
					case sessionManager:lookup(SessionId) of
						session_closed ->
							spit(Req, {struct, [{"sessionClosed", true}] });
						SessionPid ->
							Messages = struct:get_value(<<"messages">>, Struct),
							
							ProcessMessage = fun( Message ) ->
								case struct:get_first(Message) of
									{<<"query">>, Query} -> processQuery(Query, SessionId, SessionPid);
									{<<"action">>, Action} -> processAction(Action, SessionPid);
									{<<"registerTemplate">>, RegisterTemplate} -> processRegisterTemplate(RegisterTemplate, SessionPid);
									{<<"serverAdviceRequest">>, ServerAdviceRequest} -> processServerAdviceRequest(ServerAdviceRequest, SessionPid)
								end
							end,
							
							try lists:foreach( ProcessMessage, Messages) of
								ok -> spit(Req, {struct, [{"result", true}]})
							catch 
								ErrorType:Reason -> 
									spit(Req, {struct, [
										{"errorType", ErrorType}, 
										{"reason", 
											list_to_binary(io_lib:format("~p", [{Reason, erlang:get_stacktrace()}]))
										}
									] })
							end
					end;
                _ ->
                    Req:not_found()
            end;
        _ ->
            Req:respond({501, [], []})
    end.

%Utility
getFromStruct(StringKey, Struct) ->
	Result = struct:get_value(list_to_binary(StringKey), Struct),
	if
		is_binary(Result) -> binary_to_list(Result);
		true -> Result
	end.

%% Internal API

processRegisterTemplate ( RegisterTemplate, SessionPid ) ->
	Name = getFromStruct("name", RegisterTemplate),
	Template = getFromStruct("template", RegisterTemplate),
	session:registerTemplate(SessionPid, Name, Template).
	
processServerAdviceRequest ( ServerAdviceRequest, SessionPid ) ->
	session:serverAdviceRequest(SessionPid, ServerAdviceRequest).

processQuery ( Query, SessionId, SessionPid ) ->
	Expr = getFromStruct("expr", Query),
	QueryId = getFromStruct("queryId", Query),
	session:checkQuery(SessionPid, Expr, QueryId, fun(Checked) ->
		case Checked of
			true ->
				responseTime:in(SessionId, 'query', QueryId, now() ),
%				spawn(fun() ->
					Cell = eval:evaluate( expr:exprParse(Expr) ),
					% cell:injectFuncLinked - might be useful so that cell can remove funcs on session close
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
%				end);
			{false, ReferenceId} -> 
				session:sendUpdate(SessionPid, {queryReference, QueryId, ReferenceId})
		end
	end).
	
processAction ( Action, SessionPid ) ->
	ActionId = getFromStruct("actionId", Action),
	Actions = struct:get_value(<<"actions">>, Action),
	{Returned, Created} = processActionList(Actions),
	Success = lists:all(fun(X) -> X =/= error end, Returned),
	CreatedStruct = {struct, Created},
	% responseTime:out(SessionId, action, now() ),
	ActionResponse = {struct, [{"actionResponse", 
		{struct, [{"actionId", list_to_binary(ActionId)}, {"success", Success},{"returned", Returned},{"created", CreatedStruct}] }
	}]},
	session:sendUpdate(SessionPid, {actionResponse, ActionResponse}).


%% 
%% processActionList takes a list of actions, runs each eaction on the server, stores results, and returns "server.#" cells
%% processActionList:: List Action -> List String
%% 

processActionList(Actions) ->
	{Results, Variables} = processActionList(Actions, [], []),
	JsonResults = lists:map(fun(error) -> error; (ExprElement) ->
		[mblib:exprElementToJson(ExprElement), mblib:exprElementToJson(type:unparse((env:lookup(ExprElement#objectPointer.name))#object.type))]
	end, Results),
	JsonVariables = lists:map(fun({Error,error}) -> {Error,error}; ({Name,ExprElement}) ->
		{mblib:exprElementToJson(Name),[mblib:exprElementToJson(ExprElement), mblib:exprElementToJson(type:unparse((env:lookup(ExprElement#objectPointer.name))#object.type))]}
	end, Variables),	
	{JsonResults, JsonVariables}.

	
processActionList(Actions, Updates, Variables) ->
	ProcessActions = fun(Action, {UpdatesAccumulator, VariablesAccumulator}) ->
						processAction(Action, UpdatesAccumulator, VariablesAccumulator)
					end,
	{ActionUpdates, ReturnVariables} = lists:foldl(ProcessActions, {Updates, Variables}, Actions),
	{lists:reverse(ActionUpdates), ReturnVariables}.

%%
%% processAction is called bye processActionList to appropriately deal with an action sent to the server.
%%	It's result is { [ReturnVariables], [{VariableName, CellName}] } which is made for lists:foldl/3
%% processAction:: Action -> List Update -> List {String, String} -> { List Update, List {String, String} }
%% 

processAction({struct, [{<<"block">>, Action}]}, Updates, OldVariables) ->
	BlockVariables = struct:get_value(<<"variables">>, Action),
	Actions = struct:get_value(<<"actions">>, Action),
	{Returned,_} = processActionList(Actions, [], OldVariables),
	NewVariables = try lists:zip(BlockVariables, Returned)
				catch 
					_:_ ->
						throw({insufficient_returned_variables, {expected, BlockVariables}, {got, Returned}})
				end,
	{ Updates, NewVariables ++ OldVariables};
% action:create is how variables get bound to objects
processAction({struct, [{<<"create">>, Action}]}, Updates, Variables) ->
	Type = binary_to_list( struct:get_value(<<"type">>, Action) ),
	Variable = struct:get_value(<<"variable">>, Action),
	Prop = struct:get_value(<<"prop">>, Action),
	% if Variable already exists (we are in a block and it has been declared outside the block), remove it for replacing
	Variables1 = lists:keydelete(Variable, 1, Variables),
	PropDict = propToDict(Prop, Variables),
	case objects:create(Type, PropDict) of
		{error, Reason} ->
			throw({objectscreate_returned_error, Reason, PropDict}),
			{ Updates, [{Variable, error} | Variables1]};
		Object ->
			{ Updates, [{ Variable, Object } | Variables1] }
	end;
% action:return is how bound variables get returned to the client
processAction({struct, [{<<"returnValue">>, Variable}]}, Updates, Variables) ->
	case lists:keysearch(Variable, 1, Variables) of
		{value, {_, Binding} } ->
			{ [Binding|Updates], Variables};
		_ -> 
			throw({return_variable_unbound, Variable}),
			{ [error|Updates], Variables}
	end;
% action:add|remove doesn't affect the state of the response to client unless there is an error
processAction({struct, [{<<"change">>, Action}]}, Updates, Variables) ->
	ActionType = struct:get_value(<<"kind">>, Action),
	Variable = struct:get_value(<<"object">>, Action),
	Object = bindVarOrFormatExprElement( Variable, Variables ),
	if
		Object =:= error; Object =:= notfound ->
			{ [error | Updates], Variables };
		true ->
			Property = binary_to_list( struct:get_value(<<"property">>, Action) ),
			Key = bindVarOrFormatExprElement( struct:get_value(<<"key">>, Action), Variables),
			ValueName = struct:get_value(<<"value">>, Action),
			if ValueName =:= undefined -> Data = Key; true -> Data = {Key, bindVarOrFormatExprElement( ValueName, Variables ) } end,
			case ActionType of 
				<<"add">> ->
					case objects:add(Object, Property, Data) of
						ok ->
							{ Updates, Variables };
						{error, Reason} ->
							throw({objectsadd_returned_error, Reason}),
							{ [error | Updates], Variables }
					end;
				<<"remove">> ->
					case objects:remove(Object, Property, Data) of
						ok ->
							{ Updates, Variables };
						{error, Reason} ->
							throw({objectsadd_returned_error, Reason}),
							{ [error | Updates], Variables }
					end
			end
	end.

%% 
%% propToDict takes a json struct and returns a dictionary accordingly
%% propToDict:: Struct -> Dict
%% 

propToDict(Props, Conversions) ->
	propToDict(Props, Conversions, dict:new()).

propToDict({struct, []}, _, Dict) -> Dict;
propToDict({struct, [{BinaryKey, VarOrExprElement}|Props]}, Conversions, Dict) ->
	Key = binary_to_list(BinaryKey),
	Value = bindVarOrFormatExprElement(VarOrExprElement, Conversions),
	propToDict({struct, Props}, Conversions, dict:store(Key, Value, Dict)).

% propToDict({struct, []}, _, Dict) -> Dict;
% propToDict({struct, [{Key, Value}|Props]}, Conversions, Dict) ->
% 	CellName = binaryScopeVarToCellName( Value, Conversions ),
% 	propToDict({struct, Props}, Conversions, dict:store( binary_to_list(Key), env:lookup(binary_to_list(CellName)), Dict)).

%% 
%% bindVarOrFormatExprElement:: Variable | ExprEelement -> List {Variable, ExprElement} -> Number | String | Bool | Object
%% 

bindVarOrFormatExprElement(VariableOrCellName, Conversions) when is_binary(VariableOrCellName) ->
	% ?trace(binary_to_list(VariableOrCellName)),
	case binary_to_list(VariableOrCellName) of
		"server." ++ _ = ObjectName ->
			env:lookup(ObjectName);
		"shared." ++ _ = ObjectName ->
			env:lookup(ObjectName);
		"\"" ++ _ = String ->
			bindVarOrFormatExprElement(String, null);
		%TODO: this may be a hack
		"true" -> true;
		"false" -> false;
		"null" -> null;
		"<" ++ _ = XML ->
			XML;
		NumberOrVariable ->
			case lists:keysearch(VariableOrCellName, 1, Conversions) of
				{value, {_, Object} } -> Object;
				_ -> 
					try list_to_integer(NumberOrVariable)
					catch _:_ ->
						try list_to_float(NumberOrVariable)
						catch _:_ ->
							throw({variable_not_found, binary_to_list(VariableOrCellName)}),
							error % this will be when we start sending functions
						end
					end
			end
	end;
bindVarOrFormatExprElement(NumBool, _) when is_number(NumBool); is_atom(NumBool); is_boolean(NumBool) -> NumBool;
bindVarOrFormatExprElement([_|String], _) when is_list(String) -> lists:reverse( tl( lists:reverse(String) ) ).

%% 
%% binaryScopeVarToCellName:: Binary String -> List { Binary String, String } -> String
%% 
% 
% binaryScopeVarToCellName( BinaryVariable, Variables) when is_binary(BinaryVariable) ->
% 	case binary_to_list( BinaryVariable ) of
% 		"client." ++ _ ->
% 			case lists:keysearch(BinaryVariable, 1, Variables) of
% 				{value, {_, Name} } -> Name;
% 				_ -> error
% 			end;
%  		"block." ++ _ ->
% 			case lists:keysearch(BinaryVariable, 1, Variables) of
% 				{value, {_, Name} } -> Name;
% 				_ -> error
% 			end;
% 		ObjectName -> 
% 			ObjectName
% 	end.

%% 
%% spit has the side effect that the Json result is sent to the Request and then forwarded to the client that made the request
%% spit:: Request -> JsonKeyName -> JsonKeyValue -> Json
%% 

spit(Req, ObName, ObValue) ->
	Req:ok({"text/plain", [], [mochijson2:encode({struct, [{ObName, ObValue}] } )] } ).
spit(Req, Json) ->
	Req:ok({"text/plain", [], [ mochijson2:encode(Json) ] }).

get_option(Option, Options) ->
    {proplists:get_value(Option, Options), proplists:delete(Option, Options)}.

% actionUpdate(QueryId) ->
% 	{struct, [{"queryId", QueryId}, {"success", true}]}.
% 	
% actionUpdate(QueryId, Value) ->
% 	{struct, [{"queryId", QueryId}, {"success", true}, {"value", Value}]}.
% 
% actionUpdateError(QueryId) ->
% 	{struct, [{"queryId", QueryId}, {"success", false}]}.