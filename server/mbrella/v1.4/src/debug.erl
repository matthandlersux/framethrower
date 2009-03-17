-module(debug).

-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-compile(export_all).

-record(cellState, {funcs, dots, toKey, onRemoves=[], funcColor=0, intercept, done=false}).
-record(onRemove, {function, cell, id, done}).
-record(func, {function, outputCellOrIntOrFunc}).
-record(interceptState, {function, state, ownerCell}).

toList(X) when is_list(X) -> X;
toList(X) when is_function(X) -> "function";
toList(X) -> binary_to_list(mblib:exprElementToJson(X)).

getDebugHTML(Name, BaseURL) ->
	GetElemHtml = fun (Elem) ->
		case Elem of
			Cell when is_record(Cell, exprCell) ->
				Id = toList(Elem),
				"<a href=\"" ++ BaseURL ++ Id ++ "\">" ++ "Cell: " ++ Id ++ "</a>";
			Object when is_record(Object, object) ->
				Id = toList(Elem),
				"<a href=\"" ++ BaseURL ++ Id ++ "\">" ++ "Object: " ++ Id ++ "</a>";
			Intercept when is_pid(Intercept) ->
				OwnerCell = (intercept:getState(Intercept))#interceptState.ownerCell,
				Id = toList(OwnerCell),
				"<a href=\"" ++ BaseURL ++ Id ++ "\">" ++ "Intercept OwnerCell: " ++ Id ++ "</a>";
			Other ->
				toList(Elem)
		end
	end,
	
	GetPropHTML = fun (Prop) ->
		dict:fold(fun(PropName, PropVal, Acc) ->
			Acc ++ PropName ++ ": " ++ GetElemHtml(PropVal) ++ "<br />"
		end, "", Prop)
	end,
	
	GetStateArrayHTML = fun (StateArray) ->
		lists:foldr(fun(Elem, Acc) ->
			case Elem of
				{Key, Val} -> Acc ++ "{Key: " ++ GetElemHtml(Key) ++ ", Val: " ++ GetElemHtml(Val) ++ "}, ";
				_ -> Acc ++ GetElemHtml(Elem) ++ ", "
			end
		end, "", StateArray)
	end,

	GetCastingHTML = fun (CastingDict) ->
		dict:fold(fun(ClassName, ObjectString, Acc) ->
			Acc ++ ClassName ++ ": " ++ GetElemHtml(env:lookup(ObjectString)) ++ "<br />"
		end, "", CastingDict)
	end,
	
	GetDependenciesHTML = fun (CellState) ->
		OnRemoves = CellState#cellState.onRemoves,
		lists:foldr(fun(OnRemove, Acc) ->
			Acc ++ "Cell: " ++ GetElemHtml(OnRemove#onRemove.cell) ++ ", Id: " ++ toList(OnRemove#onRemove.id) ++ ", Done: " ++ toList(OnRemove#onRemove.done) ++ "<br />"
		end, "", OnRemoves)
	end,
	
	GetDependersHTML = fun (CellState) ->
		Funcs = CellState#cellState.funcs,
		dict:fold(fun(Id, Func, Acc) ->
			Acc ++ "FuncId: " ++ toList(Id) ++ ", OutputCellOrIntOrFunc: " ++ GetElemHtml(Func#func.outputCellOrIntOrFunc) ++ "<br />"
		end, "", Funcs)
	end,

	GetBottomExprHTML = fun (Bottom) ->
		expr:unparse(Bottom)
	end,

	case env:lookup(Name) of
		Object when is_record(Object, object) ->
			Name ++ ": Object <br />" ++ 
			"Type: " ++ type:unparse(Object#object.type) ++"<br />" ++
			"Prop: <br />" ++ GetPropHTML(Object#object.prop) ++ "<br />" ++
			"Casting: <br />" ++ GetCastingHTML(Object#object.castingDict) ++ "<br />";
		Cell when is_record(Cell, exprCell) ->
			Name ++ ": Cell <br />" ++ 
			"Type: " ++ toList(type:unparse(Cell#exprCell.type)) ++"<br />" ++
			"State: " ++ GetStateArrayHTML(cell:getStateArray(Cell)) ++ "<br />" ++ 
			"Done: " ++ toList((cell:getState(Cell))#cellState.done) ++ "<br /><br />" ++
			"Dependencies: " ++ GetDependenciesHTML(cell:getState(Cell)) ++ "<br />" ++
			"Dependers: " ++ GetDependersHTML(cell:getState(Cell)) ++ "<br /><br />" ++
			"Bottom Expr: " ++ GetBottomExprHTML(Cell#exprCell.bottom) ++ "<br />";
		notfound ->
			notfound
	end.
	

httpSearchPage() ->
	"
	<html>
	<body>
		<form method='get' action='debug'>
			<input type='text' name='name' />
			<input type='submit' />
		</form>
	<body>
	</html>
	".

pretty() ->
	pretty( processTotals() ).
pretty( TupleList ) ->
	NewLine = fun() -> io:format("~n", []) end,
	Printer = fun(Which, Item) ->
				io:format("~-30s", [ io_lib:format("~p", [element(Which, Item)]) ])
				% format("~-21s ~-33s ~8s ~8s ~4s~n", [A1,A2,A3,A4,A5]).
			end,
	Header = fun(Tuple) -> Printer(1, Tuple) end,				
	Print = fun(Tuple) -> lists:foreach( fun(E) -> Printer(2, E) end, tuple_to_list(Tuple) ), NewLine() end,
	
	NewLine(),
	lists:foreach(Header, tuple_to_list( lists:nth(1, TupleList) )),
	NewLine(), NewLine(),
	lists:foreach(Print, lists:keysort(1, TupleList) ),
	NewLine().

processTotals() ->
	processTotals( getProcessStats() ).
processTotals( Stats ) ->
	% Processed = [ {memory}|| UCurrentFunction <- lists:usort( [X || [_,]] ),
	%  				{Mem, CurrentFunction, MsgQLen, Status} <- Stats].
	Interesting = interestingProcessNames(),
	InitialCalls = lists:usort( [X || {_, X, _, _} <- Stats, lists:member(element(1, X), Interesting) ] ),
	Fun = fun( Call ) ->
			Memory = [ Mem || {Mem, X, _, _} <- Stats, X =:= Call],
			{ {processType, Call}, 
				{total_memory, lists:sum(  Memory )},
				{number_of_processes, length( Memory )}
			}
		end,
	lists:map(Fun, InitialCalls).
	
interestingProcessNames() ->
	{ok, Files1} = file:list_dir("/Users/handler/Documents/svn/ftrepository/server/mbrella/v1.4/src/"),
	{ok, Files2} = file:list_dir("/Users/handler/Documents/svn/ftrepository/server/pipeline/src/"),
	{ok, Files3} = file:list_dir("/Users/handler/Documents/svn/ftrepository/server/lib/"),
	[list_to_atom(Y) || [{Y,_}] <- [ parse:parse(parse:many(parse:alphaNumSpace()), X) || X <- Files1 ++ Files2 ++ Files3] ].			

getProcessStats() ->
	Processes = processes(),
	Fun = fun(Pid) -> getProcessInfo(Pid) end,
	lists:map(Fun, Processes).
	
getProcessInfo(Pid) ->
	Stats = [memory, initial_call, message_queue_len, status],
    case process_info(Pid, Stats) of
	undefined -> {0,0,0,0};
	[{_, Mem}, {_, InitialCall}, {_, MsgQLen}, {_, Status}] ->
	    {Mem, initialCall( InitialCall, Pid ), MsgQLen, Status}
    end.

initialCall(InitialCall, Pid)  ->
    case InitialCall of
		{proc_lib, init_p, _} ->
		    proc_lib:translate_initial_call(Pid);
		ICall ->
		    ICall
    end.