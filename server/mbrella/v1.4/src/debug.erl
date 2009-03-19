-module(debug).

-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-compile(export_all).

% -record(cellState, {funcs, dots, toKey, onRemoves=[], funcColor=0, intercept, done=false}).
-record(onRemove, {function, cell, id, done}).
-record(func, {function, outputCellOrIntOrFunc}).
-record(interceptState, {function, state, ownerCell}).

%% =============================================================================
%% Process interogation/forensics
%% =============================================================================



%% ====================================================
%% API
%% ====================================================

%% 
%% processOverview prints information about all interesting processes and their totals (number, memory, etc...)
%% 

processOverview() ->
	pretty( processTotals() ).

%% 
%% processMemory:: Atom -> ok
%%		processMemory prints information about the distribution of sizes of Atom processes and their totals (ex: processMemory( cell ))
%% 

processMemory( Type ) ->
	pretty( processDistributionTotals( Type ) ).

%% 
%% pidFromStat:: Number -> Pid
%%		pidFromStat takes a number and searches for a process taking up that amount of memory
%% pidFromStat:: Atom -> a -> Pid
%% 		searches all processes for process_info Stat that matches StatValue
%% 
	
pidFromStat(MemoryValue) ->
	getProcessStats({[memory], MemoryValue}).
pidFromStat(Stat, StatValue) ->
	getProcessStats({[Stat], StatValue}).
	
largeCellMemoryUsage() ->
	Max = lists:max( [ Size || {_, {_, Size}, _, _} <- processDistributionTotals( cell ) ] ),
	Pid = pidFromStat( Max ),
	cellMemoryUsage( Pid ).

%% ====================================================
%% Internal API
%% ====================================================

cellMemoryUsage( Pid ) when is_pid(Pid) ->
	State = gen_server:call( Pid, getState ),
	MemUsage = recordMemoryUsage( State ),
	prettyList( MemUsage ).
	
prettyList( Tuple ) when is_tuple(Tuple) ->
	prettyList( tuple_to_list(Tuple) );
prettyList( List ) ->
	pretty( [ {{element, E}, {value, V}} || {E, V} <- List ] ).

recordMemoryUsage( Record ) when is_tuple(Record) ->
	RecordName = element(1, Record),
	try mblib:rInfo(RecordName) of
		Fields ->
			tupleMemoryUsage( erlang:append_element( Record, Record), [RecordName] ++ Fields ++ [total_mem_usage] )
	catch
		_:_ -> 
			?trace({record_not_found, RecordName}),
			tupleMemoryUsage( erlang:append_element( Record, Record) )
	end.

tupleMemoryUsage( Tuple ) ->
	tupleMemoryUsage( Tuple, [ Number || Number <- lists:seq(1, size(Tuple)) ] ).
tupleMemoryUsage( Tuple, Tags ) ->
	list_to_tuple( lists:zip(Tags, [ iolist_size( term_to_binary(Element) ) || Element <- tuple_to_list(Tuple) ] ) ).

%% 
%% pretty:: List Tuple TaggedTuple -> ok
%%		pretty takes a list of tuples that are tagged, ex: [{{tag1, Value},{tag2, Value2}},{{tag1,OtherValue}, ...}]
%%		and prints them to the console using the tags as a header
%% 

pretty( TupleList ) ->
	NewLine = fun() -> io:format("~n", []) end,
	Printer = fun(Which, Item) ->
				io:format("~-25s", [ io_lib:format("~p", [element(Which, Item)]) ])
				% format("~-21s ~-33s ~8s ~8s ~4s~n", [A1,A2,A3,A4,A5]).
			end,
	Header = fun(Tuple) -> Printer(1, Tuple) end,				
	Print = fun(Tuple) -> lists:foreach( fun(E) -> Printer(2, E) end, tuple_to_list(Tuple) ), NewLine() end,
	
	NewLine(),
	lists:foreach(Header, tuple_to_list( lists:nth(1, TupleList) )),
	NewLine(), NewLine(),
	lists:foreach(Print, lists:keysort(1, TupleList) ),
	NewLine().

%% 
%% processTotals:: List Tuple TaggedTuple
%%		running without a parameter uses the result from getProcessStats, essentially this returns
%%		a list of tagged tuples with information about processes, the each entry in the list is
%%		a type of process that we have programmed, mainly cell, memoize, session, etc...
%% 

processTotals() ->
	processTotals( getProcessStats() ).
processTotals( Stats ) ->
	% Processed = [ {memory}|| UCurrentFunction <- lists:usort( [X || [_,]] ),
	%  				{Mem, CurrentFunction, MsgQLen, Status} <- Stats].
	Interesting = interestingProcessNames(),
	InitialCalls = lists:usort( [X || {_, X, _, _, _} <- Stats, lists:member(element(1, X), Interesting) ] ),
	Fun = fun( Call ) ->
			Memory = [ Mem || {Mem, X, _, _, _} <- Stats, X =:= Call],
			{ 
				{processType, Call}, 
				{total_memory, lists:sum(  Memory )},
				{number_of_processes, length( Memory )}
			}
		end,
	lists:map(Fun, InitialCalls).
	
%% 
%% processDistributionTotals:: Atom -> List Tuple TaggedTuple
%%		processDistributionTotals takes the name of a type of process (ex: cell) and finds all the 
%%		memory sizes that that type of process has in the system.  It then finds totals for each
%%		size and returns a list of tuples of tagged tuples
%% 
	
processDistributionTotals( Type ) ->
	Stats = processDistribution( Type ),
	Sizes = lists:usort( [Mem || {_, {_, Mem}} <- Stats] ),
	Fun = fun( Size ) ->
				SameSizeProcesses = [ 1 || {_, {_, Mem}} <- Stats, Size =:= Mem],
				{
					{processType, Type},
					{processSize, Size},
					{numOfThese, length(SameSizeProcesses) },
					{totalMemoryUsage, length(SameSizeProcesses) * Size}
		
				}
			end,
	lists:map(Fun, Sizes).

%% 
%% processDistribution:: List Atom | Atom -> List {{type, Atom}, {memory, Number}}
%%		this function prepares data for processDistributionTotals
%% 

processDistribution() ->
	processDistribution( interestingProcessNames() ).
%TODO: make this work on multiple types of processes
processDistribution( [TypeOfProcess|_] ) ->
	Stats = getProcessStats(),
	Stats1 = [Stat || {_, Type, _, _, _} = Stat <- Stats, element(1, Type) =:= TypeOfProcess ],
	Stats2 = [{{type, Type}, {memory, Mem}} || {Mem, Type, _, _, _} <- lists:reverse( lists:keysort(1, Stats1) )];
processDistribution( TypeOfProcess ) ->
	processDistribution( [TypeOfProcess] ).

%% 
%% interestingProcessNames:: List Atom
%%		this function gets the names of all the modules that we have written so that we can focus on those 
%%		processes alone
%% 

interestingProcessNames() ->
	{ok, Files1} = file:list_dir("./mbrella/v1.4/src/"),
	{ok, Files2} = file:list_dir("./pipeline/src/"),
	{ok, Files3} = file:list_dir("./lib/"),
	[list_to_atom(Y) || [{Y,_}] <- [ parse:parse(parse:many(parse:alphaNumSpace()), X) || X <- Files1 ++ Files2 ++ Files3] ].			

%% 
%% getProcessStats:: List Tuple 
%%		runs getProcessInfo on all open processes
%% 

getProcessStats() ->
	[ getProcessInfo(Pid) || Pid <- processes() ].

%% 
%% getProcessStats:: {Atom, a} -> Pid
%%		searches for a specific process with specific information Item matching specific Value and returns the PID
%% getProcessStats:: Atom -> List Tuple
%%		allows you to get process_info for every process returning only a specific type of info (ex: heap_size) 
%% 

getProcessStats({Item, Value}) ->
	{value, {_, Pid}} = lists:keysearch(Value, 1, getProcessStats(Item) ),
	% add more information for this output
	Pid;
getProcessStats(Stat) ->
	[ getProcessInfo( Pid, Stat) || Pid <- processes() ].

%% 
%% getProcessInfo:: Pid -> Tuple
%%		returns specific information about a process that we find interesting
%% 

getProcessInfo(Pid) ->
 	getProcessInfo(Pid, [memory, initial_call, message_queue_len, status]).

%% 
%% getProcessInfo:: Pid -> List Atom -> List Tuple
%% 		returns a list of [{memory, initial_call, message_queue_len, status},...] or
%%		if you pass a specific Atom to look up in process_info/2, [{atom, Pid},...]
%% 

getProcessInfo(Pid, Stats) ->
    case process_info(Pid, Stats) of
	undefined -> {0,0,0,0};
	[{_, Mem}, {_, InitialCall}, {_, MsgQLen}, {_, Status}] ->
	    {Mem, initialCall( InitialCall, Pid ), MsgQLen, Status, Pid};
	[{_, Stat}] ->
		{Stat, Pid}
    end.

%% 
%% initialCall:: InitialCall -> Pid -> InitialCall
%%		if you call process_info(Pid, initial_call), often the result is {proc_lib, init_p, _} which is too vague
%%		this function elaborates on what the actual initial call to a spawned process was
%% 

initialCall(InitialCall, Pid)  ->
    case InitialCall of
		{proc_lib, init_p, _} ->
		    proc_lib:translate_initial_call(Pid);
		ICall ->
		    ICall
    end.

%% =============================================================================
%% Html debugging
%% =============================================================================


toList(X) when is_list(X) -> X;
toList(X) when is_function(X) -> "function";
toList(X) -> binary_to_list(mblib:exprElementToJson(X)).

getDebugHTML(Name, BaseURL) ->
	GetElemHtml = fun (Elem) ->
		case Elem of
			Cell when is_record(Cell, cellPointer) ->
				Id = toList(Elem),
				"<a href=\"" ++ BaseURL ++ Id ++ "\">" ++ "Cell: " ++ Id ++ "</a>";
			Object when is_record(Object, objectPointer) ->
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
				{pair, Key, Val} -> Acc ++ "{Key: " ++ GetElemHtml(Key) ++ ", Val: " ++ GetElemHtml(Val) ++ "}, ";
				_ -> Acc ++ GetElemHtml(Elem) ++ ", "
			end
		end, "", StateArray)
	end,

	GetCastingHTML = fun (CastingDict) ->
		dict:fold(fun(ClassName, ObjectString, Acc) ->
			Acc ++ ClassName ++ ": " ++ GetElemHtml(#objectPointer{name = ObjectString}) ++ "<br />"
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
			CellPointer = #cellPointer{name = Name, pid = Cell#exprCell.pid},
			Name ++ ": Cell <br />" ++ 
			"Type: " ++ toList(type:unparse(Cell#exprCell.type)) ++"<br />" ++
			"State: " ++ GetStateArrayHTML(cell:getStateArray(CellPointer)) ++ "<br />" ++ 
			"Done: " ++ toList((cell:getState(CellPointer))#cellState.done) ++ "<br /><br />" ++
			"Dependencies: " ++ GetDependenciesHTML(cell:getState(CellPointer)) ++ "<br />" ++
			"Dependers: " ++ GetDependersHTML(cell:getState(CellPointer)) ++ "<br /><br />" ++
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

