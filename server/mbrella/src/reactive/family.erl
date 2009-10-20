-module (family).
-compile(export_all).

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).


%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================

%% 
%% makeTuple :: Number -> ((a1 -> ... -> aN) -> TupleN a1 ... aN)
%% 		
%%		

makeTuple(N) when is_integer(N) ->
	makeTuple(N,[]).
	
%% ====================================================
%% Internal API
%% ====================================================

%% 
%% makeTuple :: 0 -> List a -> Tuple a1 ... aN
%% 		| Number -> List a -> (a -> makeTuple)
%%		this is a tough type signature to write out
%%		


makeTuple(0, Args) ->
	makeTupleFromList(Args);
makeTuple(Arity, Args) ->
	fun(X) ->
		makeTuple(Arity - 1, [X] ++ Args)
	end.
	
%% 
%% makeTupleFromList :: List a1 ... aN -> TupleN a1 ... aN
%% 		
%%		

makeTupleFromList(ListOfElements) ->
	list_to_tuple(lists:reverse(ListOfElements)).

%% ====================================================
%% Utilities
%% ====================================================

