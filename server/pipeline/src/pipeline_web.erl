%% @author author <author@example.com>
%% @copyright YYYY author.

%% @doc Web server for pipeline.

-module(pipeline_web).
-author('author <author@example.com>').
-include ("../../mbrella/v1.4/include/scaffold.hrl").

-export([start/1, stop/0, loop/2]).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

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
												Cell = eval:evaluate( expr:exprParse( binary_to_list(Expr) ) ),
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
							Returned = processActionList(Actions),
							Success = lists:all(fun(X) -> X =/= error end, Returned),
							spit(Req, {struct, [{"success", Success},{"returned", Returned}] } )
					end;
                _ ->
                    Req:not_found()
            end;
        _ ->
            Req:respond({501, [], []})
    end.

%% Internal API

%% 
%% processActionList takes a list of actions, runs each eaction on the server, stores results, and returns "server.#" cells
%% processActionList:: List Action -> List String
%% 

processActionList(Actions) ->
	Results = processActionList(Actions, [], []),
	lists:map(fun(List) when is_list(List) -> list_to_binary(List); (List) -> List end, Results).
	
processActionList(Actions, Updates, Variables) ->
	ProcessActions = fun(Action, {UpdatesAccumulator, VariablesAccumulator}) ->
						ActionType = struct:get_value(<<"action">>, Action),
						processAction(ActionType, Action, UpdatesAccumulator, VariablesAccumulator)
					end,
	{ActionUpdates, _} = lists:foldl(ProcessActions, {Updates, Variables}, Actions),
	lists:reverse(ActionUpdates).

%%
%% processAction is called bye processActionList to appropriately deal with an action sent to the server.
%%	It's result is { [ReturnVariables], [{VariableName, CellName}] } which is made for lists:foldl/3
%% processAction:: Action -> List Update -> List {String, String} -> { List Update, List {String, String} }
%% 

processAction(<<"block">>, Action, Updates, OldVariables) ->
	BlockVariables = struct:get_value(<<"variables">>, Action),
	Actions = struct:get_value(<<"actions">>, Action),
	Returned = processActionList(Actions, [], OldVariables),
	NewVariables = lists:zip(BlockVariables, Returned),
	{ Updates, NewVariables ++ OldVariables};	
processAction(<<"create">>, Action, Updates, Variables) ->
	Type = binary_to_list( struct:get_value(<<"type">>, Action) ),
	Variable = struct:get_value(<<"variable">>, Action),
	Prop = struct:get_value(<<"prop">>, Action),
	PropDict = propToDict(Prop, Variables),
	case objects:create(Type, PropDict) of
		{ok, Binding} ->
			{ Updates, [{Variable, Binding} | Variables] };
		{error, _Reason} ->
			{ Updates, [{Variable, error} | Variables]}
	end;
processAction(<<"return">>, Action, Updates, Variables) ->
	?trace(Variables),
	Variable = struct:get_value(<<"variable">>, Action),
	case lists:keysearch(Variable, 1, Variables) of
		{value, {_, Binding} } ->
			{ [Binding|Updates], Variables};
		_ -> 
			{ [error|Updates], Variables}
	end;
processAction(ActionType, Action, Updates, Variables) when ActionType =:= <<"add">> orelse ActionType =:= <<"remove">> ->
	Variable = struct:get_value(<<"object">>, Action),
	Object = binaryScopeVarToCellName( Variable, Variables ),
	if
		Object =:= error ->
			{ [error | Updates], Variables };
		true ->
			Property = binary_to_list( struct:get_value(<<"property">>, Action) ),
			Key = binary_to_list( struct:get_value(<<"key">>, Action) ),
			Value = struct:get_value(<<"value">>, Action),
			if Value =:= undefined -> Data = Key; true -> Data = {Key, Value} end,
			case ActionType of 
				<<"add">> ->
					case objects:add(Object, Property, Data) of
						ok ->
							{ Updates, Variables };
						{error, _Reason} ->
							{ [error | Updates], Variables }
					end;
				<<"remove">> ->
					case objects:remove(Object, Property, Data) of
						ok ->
							{ Updates, Variables };
						{error, _Reason} ->
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
propToDict({struct, [{Key, Value}|Props]}, Conversions, Dict) ->
	propToDict({struct, Props}, Conversions, dict:store( binary_to_list(Key), binaryScopeVarToCellName( Value, Conversions ), Dict)).

%% 
%% binaryScopeVarToCellName:: Binary String -> List { Binary String, String } -> String
%% 

binaryScopeVarToCellName( BinaryVariable, Variables) when is_binary(BinaryVariable) ->
	case binary_to_list( BinaryVariable ) of
		"client." ++ _ ->
			case lists:keysearch(BinaryVariable, 1, Variables) of
				{value, {_, Name} } -> Name;
				_ -> error
			end;
 		"block." ++ _ ->
			case lists:keysearch(BinaryVariable, 1, Variables) of
				{value, {_, Name} } -> Name;
				_ -> error
			end;
		ObjectName -> 
			ObjectName
	end.

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
