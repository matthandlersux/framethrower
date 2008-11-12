-module (mblib).
-compile (export_all).

-include ("../include/scaffold.hrl").


%% ====================================================
%% record manip functions
%% ====================================================

recordReplace(Record, []) -> Record;
recordReplace(Record, [{Field, NewField}|T]) ->
	recordReplace( recordReplace(Record, Field, NewField), T).

recordReplace(Record, Field, NewField) ->
	Type = element(1, Record),
	Fields = r_info(Type),
	Pos = which(Field, Fields),
	erlang:setelement(Pos + 1, Record, NewField).
	
r_info(ob) ->
	record_info(fields, ob);
r_info(startcap) ->
	record_info(fields, startcap);
r_info(pin) ->
	record_info(fields, pin);
r_info(cache) ->
	record_info(fields, cache);
r_info(process) ->
	record_info(fields, process);
r_info(interface) ->
	record_info(fields, interface);
r_info(crossReference) ->
	record_info(fields, crossReference).

%% 
%% getVal pulls an element out of a record so that you can access record elements using variables
%% 
getVal(Record, Element) ->
	Fields = record_info(fields, ob),
	Pos = which(Element, Fields),
	element(Pos + 1, Record).

%% 
%% which figures out the placement of an element in a record
%% 
which(E, F) ->
	case lists:member(E, F) of
		true ->
			which(E, F, 1);
		false ->
			0
	end.

which(_, [], Pos) ->
	Pos;
which(E, [H|T], Pos) ->
	if
		H =:= E ->
			Pos;
		true ->
			which(E, T, Pos + 1)
	end.