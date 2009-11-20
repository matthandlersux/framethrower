-module (supervisor).
-behaviour(supervisor).

-export([start/0, startInShell/0, start_link/1, init/1]).

start() ->
	spawn( 	fun() ->
				supervisor:start_link({local, ?MODULE}, ?MODULE, _Arg = [])
			end).

startInShell() ->
	{ok, Pid} = supervisor:start_link({local, ?MODULE}, ?MODULE, _Arg = []),
	unlink(Pid).
	
start_link(Args) ->
	supervisor:start_link({local, ?MODULE}, ?MODULE, Args).
	
init([]) ->
	{ok,
		{
			{one_for_one, 3, 10},
			[
				{
					sessionManager,
					{sessionManager, start, []},
					permanent,
					10000,
					worker,
					[sessionManager]
				},
				{
					functionTable,
					{functionTable, create, []},
					permanent,
					10000,
					worker,
					[functionTable]
				},
				{
					mewpile,
					{mewpile, new, []},
					permanent,
					10000,
					worker,
					[mewpile]
				},
			]		
		}
	}.