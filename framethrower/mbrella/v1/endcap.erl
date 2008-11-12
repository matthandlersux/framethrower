-module (endcap).
-compile(export_all).

new() ->
	spawn(fun() -> loop(InPin) end).

loop() ->
	
	