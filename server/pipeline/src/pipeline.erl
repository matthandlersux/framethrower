%% @author author <author@example.com>
%% @copyright YYYY author.

%% @doc TEMPLATE.

-module(pipeline).
-author('author <author@example.com>').
-export([start/0, stop/0]).

ensure_started(App) ->
    case application:start(App) of
        ok ->
            ok;
        {error, {already_started, App}} ->
            ok
    end.
        
%% @spec start() -> ok
%% @doc Start the pipeline server.
start() ->
    pipeline_deps:ensure(),
    ensure_started(crypto),
    application:start(pipeline).

%% @spec stop() -> ok
%% @doc Stop the pipeline server.
stop() ->
    Res = application:stop(pipeline),
    application:stop(crypto),
    Res.
