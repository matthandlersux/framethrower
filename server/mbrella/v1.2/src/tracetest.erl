-module(tracetest).
-compile(export_all).

start() -> spawn_link(tracetest, loop, []).

send(Pid) ->
	Pid ! {self(), ping},
	receive pong -> pong end.
	
loop() ->
	receive
		{Pid, ping} ->
			spawn(crash, do_not_exist, []),
			Pid ! pong,
			loop()
	end.