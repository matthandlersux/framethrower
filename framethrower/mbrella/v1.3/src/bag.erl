-module (bag).
-export([new/0, add_element/2, del_element/2, to_list/1, clear_score/1, clear_score/2, get_score/2]).

new() -> 
	dict:new().

add_element(Key, Data) ->
	try dict:fetch(Key, Data) of
		Val ->
			dict:store(Key, Val + 1, Data)
	catch
		_:_ ->
			dict:store(Key, 1, Data)
	end.
	
del_element(Key, Data) ->
	try dict:fetch(Key, Data) of
		1 ->
			dict:erase(Key, Data);
		Val ->
			dict:store(Key, Val - 1, Data)
	catch
		_:_ ->
			Data
	end.

clear_score(Data) ->
	Fun = fun(_, _) -> 1 end,
	dict:map(Fun, Data).

clear_score(Key, Data) ->
	case dict:is_key(Key, Data) of
		true -> dict:store(Key, 1, Data);
		false -> Data
	end.
	
get_score(Key, Data) ->
	try dict:fetch(Key, Data) of
		Val ->
			Val
	catch
		_:_ ->
			0
	end.	
	
to_list(Data) ->
	List = dict:to_list(Data),
	{Keys, _} = lists:unzip(List),
	Keys.