%% @author author <author@example.com>
%% @copyright YYYY author.

%% @doc Web server for pipeline.

-module(pipeline_web).
-author('author <author@example.com>').
-include ("../../mbrella/v1.4/include/scaffold.hrl").

-export([start/1, stop/0, loop/2]).

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
                _ ->
                    Req:serve_file(Path, DocRoot)
            end;
        'POST' ->
            case Path of
				"newSession" ->
					SessionId = session:new(),
					spit(Req, "sessionId", SessionId);
				"pipeline" ->
					Data = Req:parse_post(),
					Json = proplists:get_value("json", Data),
					Struct = mochijson2:decode(Json),
					LastMessageId = struct:get_value(<<"lastMessageId">>, Struct),
					SessionId = struct:get_value(<<"sessionId">>, Struct),
					sessionManager ! {pipeline, self(), {SessionId, LastMessageId}},
					receive 
						{updates, Updates, LastMessageId2} ->
							JsonOut = {struct, [{"updates", Updates},{"lastMessageId", LastMessageId2}]};
						JsonOut ->
							JsonOut
					end,
					spit(Req, JsonOut);
				"query" ->
					Data = Req:parse_post(),
					Json = proplists:get_value("json", Data),
					Struct = mochijson2:decode(Json),
					SessionId = struct:get_value(<<"sessionId">>, Struct),
					case session:lookup(SessionId) of
						session_closed ->
							spit(Req, {struct, [{"sessionClosed", true}] });
						SessionPid ->
							Queries = struct:get_value(<<"queries">>, Struct),
							ProcessQuery = fun( Query ) ->
												Expr = struct:get_value(<<"expr">>, Query),
												QueryId = struct:get_value(<<"queryId">>, Query),
												% io:format("expr: ~p~nquery: ~p~n~n", [Expr, QueryId])
												#exprCell{pid = Cell} = eval:evaluate( expr:exprParse( binary_to_list(Expr) ) ),
												cell:injectFunc(Cell,  
													fun(Val) ->
														SessionPid ! {data, {QueryId, add, Val}},
														fun() -> 
															case Val of
																{Key,_} -> SessionPid ! {data, {QueryId, remove, Key}};
																_ -> SessionPid ! {data, {QueryId, remove, Val}}
															end
														end
													end												
												)
											end,
							lists:foreach(ProcessQuery, Queries),
							spit(Req, true)
					end;
				"action" ->
					Data = Req:parse_post(),
					Json = proplists:get_value("json", Data),
					Struct = mochijson2:decode(Json),
					SessionId = struct:get_value(<<"sessionId">>, Struct),
					case session:lookup(SessionId) of
						session_closed ->
							spit(Req, {struct, [{"sessionClosed", true}] });
						_SessionPid ->
							Actions = struct:get_value(<<"actions">>, Struct),
							ProcessActions = fun(Action, {Updates, Acc}) ->
												Action = struct:get_value(<<"action">>, Action),
												QueryId = struct:get_value(<<"queryId">>, Action),
												case Action of
													<<"create">> ->
														Type = binary_to_list( struct:get_value(<<"type">>, Action) ),
														Variable = struct:get_value(<<"variable">>, Action),
														case object:create( Type) of
															{ok, Name} ->
																{ [actionUpdate(QueryId, Name) | Updates], [{Variable, Name} | Acc] };
															{error, _Reason} ->
																{ [actionUpdateError(QueryId) | Updates], [{Variable, error} | Acc]}
														end;														
													<<"intact">> ->
														Variable = struct:get_value(<<"object">>, Action),
														Object = case binary_to_list( Variable ) of
																	"client." ++ _ ->
																		case lists:keysearch(Variable, 1, Acc) of
																			{value, {_, Name} } -> Name;
																			_ -> error
																		end;
																	ObjectName -> 
																		ObjectName
																end,
														if
															Object =:= error ->
																{ [actionUpdateError(QueryId) | Updates], Acc };
															true ->
																Property = struct:get_value(<<"property">>, Action),
																Intact = struct:get_value(<<"intact">>, Action),
																Key = struct:get_value(<<"key">>, Action),
																case object:intact(Object, Property, Intact, Key) of
																	ok ->
																		{ [actionUpdate(QueryId) | Updates], Acc };
																	{error, _Reason} ->
																		{ [actionUpdateError(QueryId) | Updates], Acc }
																end
														end
												end			
										end,
							{ActionUpdates, _} = lists:foldl(ProcessActions, {[], []}, Actions),
							spit(Req, {struct, [{"actionUpdates", ActionUpdates}] } )
					end;
                _ ->
                    Req:not_found()
            end;
        _ ->
            Req:respond({501, [], []})
    end.

%% Internal API
spit(Req, ObName, ObValue) ->
	Req:ok({"text/plain", [], [mochijson2:encode({struct, [{ObName, ObValue}] } )] } ).
spit(Req, Json) ->
	Req:ok({"text/plain", [], [ mochijson2:encode(Json) ] }).

get_option(Option, Options) ->
    {proplists:get_value(Option, Options), proplists:delete(Option, Options)}.

actionUpdate(QueryId) ->
	{struct, [{"queryId", QueryId}, {"success", true}]}.
	
actionUpdate(QueryId, Value) ->
	{struct, [{"queryId", QueryId}, {"success", true}, {"value", Value}]}.

actionUpdateError(QueryId) ->
	{struct, [{"queryId", QueryId}, {"success", false}]}.
