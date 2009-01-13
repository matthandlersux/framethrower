%% @author author <author@example.com>
%% @copyright YYYY author.

%% @doc Callbacks for the pipeline application.

-module(pipeline_app).
-author('author <author@example.com>').

-behaviour(application).
-export([start/2,stop/1]).


%% @spec start(_Type, _StartArgs) -> ServerRet
%% @doc application start callback for pipeline.
start(_Type, _StartArgs) ->
    pipeline_deps:ensure(),
    pipeline_sup:start_link().

%% @spec stop(_State) -> ServerRet
%% @doc application stop callback for pipeline.
stop(_State) ->
    ok.
