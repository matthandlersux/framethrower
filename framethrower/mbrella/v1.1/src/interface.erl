-module (interface).
-compile (export_all).

-include ("../include/scaffold.hrl").
-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).

new(Type, SubType) ->
	#interface{type = Type, subType = SubType}.