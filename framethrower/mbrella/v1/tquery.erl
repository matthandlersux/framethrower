-module (tquery).
-compile (export_all).

startcap() -> 
	startcap:start().
	
interface() ->
	interface:start().
	
ambient() ->
	ambient:start().
	
box() ->
	box:start().

component() ->
	component:start().
	
process() ->
	process:start().
	
endcap() ->
	endcap:start().