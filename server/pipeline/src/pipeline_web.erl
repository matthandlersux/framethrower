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
												#exprCell{pid = Cell} = eval:evaluate( expr:expr( binary_to_list(Expr) ) ),
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
