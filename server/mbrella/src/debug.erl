-module(debug).

-include("../include/scaffold.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

-compile(export_all).

% -record(cellState, {funcs, dots, toKey, onRemoves=[], funcColor=0, intercept, done=false}).

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

%% 
%% largeCellMemoryUsage:: ok
%%		largeCellMemoryUsage finds the largest cell byte size, gets its state, and shows how much memory is
%%		in each part of the state of that cell
%% 

largeCellMemoryUsage() ->
	Max = lists:max( [ Size || {_, {_, Size}, _, _} <- processDistributionTotals( cell ) ] ),
	Pid = pidFromStat( Max ),
	cellMemoryUsage( Pid ).

%% 
%% memoryUsage:: ok
%%		memoryUsage will take a tuple and print out the distribution of memory in each part of the tuple
%% 

memoryUsage( Term ) when is_tuple(Term) ->
	prettyList( recordMemoryUsage( Term ) ).
	
%% 
%% allCellFunctionMemory:: Number -> []
%%		this will print out the memory usage of Number cells currently alive on the server, Number defaults to
%%		100
%% 

allCellFunctionMemory() ->
	allCellFunctionMemory(100).
allCellFunctionMemory(N) ->
	Cells = processDistribution(cell),
	allCellFunctionMemory(N, Cells).

%% ====================================================
%% Internal API
%% ====================================================



allCellFunctionMemory(0, _) -> [];
allCellFunctionMemory(N, [{_,{_,Memory},{_,Pid}}|T]) ->
	State = gen_server:call(Pid, getState),
	Dict = element(2, State),
	{_, Funcs} = lists:unzip( dict:to_list(Dict) ),
	case length(Funcs) of
		0 -> N1 = N;
		1 -> N1 = N;
		_ ->
			N1 = N-1,
			io:format("--------------------------~nMemory: ~p~n", [Memory]),
			[io:format("~-35s ~-20s~n", [Fu, M] ) || {Fu, M} <- [{io_lib:format("~p", [F]), integer_to_list(byteSize(F))} || {_,F,_} <- Funcs] ]
	end,
	allCellFunctionMemory( N1, T).

%% 
%% cellMemoryUsage:: Pid | Number -> ok
%%		you can pass this function a Pid and it will output the memory usage of that cells state (provided it is a cell)
%%		also, you can pass this function the size of a cell and it will find a cell matching that size first, then output
%%		memory usage info
%% 

cellMemoryUsage( Pid ) when is_pid(Pid) ->
	State = gen_server:call( Pid, getState ),
	MemUsage = recordMemoryUsage( State ),
	prettyList( MemUsage );
cellMemoryUsage( Number ) ->
	State = gen_server:call( pidFromStat(Number), getState ),
	MemUsage = recordMemoryUsage( State ),
	prettyList( MemUsage).

%% 
%% prettyList:: Tuple TaggedTuple | List TaggedTuple -> ok
%%		this will take a tuple of the form {{tag, Val},{tag2, Val2},...} or a list [{tag, Val},{tag2, Val2},...]
%%		and print out a tag and its value on each line
%% 
	
prettyList( Tuple ) when is_tuple(Tuple) ->
	prettyList( tuple_to_list(Tuple) );
prettyList( List ) ->
	pretty( [ {{element, E}, {value, V}} || {E, V} <- List ] ).
	
%% 
%% recordMemoryUsage:: Record -> Tagged Tuple
%% 		this will take a Record and make a Tagged tuple st. #Record.item -> {...,{item, ItemValue},...}
%%		right now only works on records defined in mblib:rInfo
%%		if cant find record info, treats it like a record
%%
%%		the output can be used in prettyList/1
%% 

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

%% 
%% tupleMemoryUsage:: (Tuple | Tuple -> Tags) -> Tagged Tuple
%%		takes a tuple and optional tags, and creates a tagged tuple st. the values are replaced with their byte size
%% 

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
	Sizes = lists:usort( [Mem || {_, {_, Mem}, _} <- Stats] ),
	Fun = fun( Size ) ->
				SameSizeProcesses = [ 1 || {_, {_, Mem}, _} <- Stats, Size =:= Mem],
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
	Stats2 = [{{type, Type}, {memory, Mem}, {pid, Pid}} || {Mem, Type, _, _, Pid} <- lists:reverse( lists:keysort(1, Stats1) )];
processDistribution( TypeOfProcess ) ->
	processDistribution( [TypeOfProcess] ).

%% 
%% interestingProcessNames:: List Atom
%%		this function gets the names of all the modules that we have written so that we can focus on those 
%%		processes alone
%% 

interestingProcessNames() ->
	{ok, Files1} = file:list_dir("./mbrella/src/"),
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

byteSize( Term ) ->
	iolist_size( term_to_binary( Term ) ).

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
		Dependencies = CellState#cellState.dependencies,
		lists:foldr(fun(Dependency, Acc) ->
			Acc ++ "Cell: " ++ GetElemHtml(Dependency#depender.cell) ++ ", Id: " ++ toList(Dependency#depender.id) ++ "<br />"
		end, "", Dependencies)
	end,
	
	GetDependersHTML = fun (CellState) ->
		Funcs = CellState#cellState.funcs,
		dict:fold(fun(Id, Func, Acc) ->
			Acc ++ "FuncId: " ++ toList(Id) ++ ", Depender: " ++ GetElemHtml(Func#func.depender) ++ "<br />"
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

%% ====================================================
%% new cell debugging
%% ====================================================

% debug sending messages and printing them
f(),
C1 = cell:makeCell(set).
C2 = cell:makeCell(set).
cell:injectIntercept(C2, {{debug, []}, []}),
cell:injectOutput(C1, C2),
cell:sendElements(C1, {"name", self()}, [{add,matt},{add,toby},{remove, toby},{add,andrew},{add,matt}]).

% debug isEmpty
f(),
C = cell:makeCell(unit).
S = cell:makeCell(set).
D = cell:makeCell(unit).
cell:addValues(S, [toby, matt, andrew]),
cell:injectOutput(C, D),
cell:injectIntercept(D, {{debug, []}, []}),
cell:injectOutput(S, isEmpty, C).

% debug reactiveAnd w/o flags
f(),
C1 = cell:makeCell(unit).
C2 = cell:makeCell(unit).
S = cell:makeCell(unit).
D = cell:makeCell(unit).
cell:addValue(C1, null),
cell:injectIntercept(S, intercepts:construct(reactiveAnd, [C1, C2])),
cell:injectIntercept(D, {{debug, []}, []}),
cell:injectOutput(C1, S),
cell:injectOutput(C2, S),
cell:injectOutput(S, D).

% debug reactiveOr w/o flags
f(),
C1 = cell:makeCell(unit).
C2 = cell:makeCell(unit).
S = cell:makeCell(unit).
D = cell:makeCell(unit).
cell:addValue(C1, null),
cell:injectIntercept(D, {{debug, []}, []}),
cell:injectOutput(C1, S),
cell:injectOutput(C2, S),
cell:injectOutput(S, D).

% debug setDifference w/o flags
f(),
S1 = cell:makeCell(set).
S2 = cell:makeCell(set).
S = cell:makeCell(set).
D = cell:makeCell(set).
cell:addValues(S1, [toby, matt, andrew, harold, mattg]),
cell:addValues(S2, [matt, mattg, ed, tedg]),
cell:injectIntercept(D, {{debug, []}, []}),
cell:injectIntercept(S, intercepts:construct(setDifference, [S1, S2])),
cell:injectOutput(S1, S),
cell:injectOutput(S2, S),
cell:injectOutput(S, D).

cell:removeValue(S1, toby).
cell:addValue(S2, toby).
cell:addValue(S1, toby).
cell:removeValue(S1, toby).
cell:removeValue(S2, toby).
cell:addValue(S1, toby).

% debug setDifference w/o flags
f(),
S1 = cell:makeCell(set).
S2 = cell:makeCell(set).
S = cell:makeCell(set).
D = cell:makeCell(set).
cell:addValues(S1, [toby, matt, andrew, harold, mattg]),
cell:addValues(S2, [matt, mattg, ed, tedg]),
cell:injectIntercept(D, {{debug, []}, []}),
cell:injectIntercept(S, intercepts:construct(setDifference, [S1, S2])),
cell:setFlag(S, waitForDone, true),
cell:injectOutput(S, D),
cell:injectOutput(S2, S).

cell:injectOutput(S1, S),
cell:removeValue(S1, toby).
cell:addValue(S2, toby).
cell:addValue(S1, toby).
cell:removeValue(S1, toby).
cell:removeValue(S2, toby).
cell:addValue(S1, toby).

% debug takeOne
f(),
S = cell:makeCell(set).
U = cell:makeCell(unit).
D = cell:makeCell(unit).
cell:addValues(S, [toby, matt, andrew, harold, mattg]),
cell:injectIntercept(D, {{debug, []}, []}),
cell:injectOutput(S, takeOne, U),
cell:injectOutput(U, D).

% debug invert
f(),
M = cell:makeCell(map).
S1 = cell:makeCell(set).
S2 = cell:makeCell(set).
S3 = cell:makeCell(set).
I = cell:makeCell(map).
D = cell:makeCell(unit).
cell:injectIntercept(D, {{debug, []}, []}).

cell:addValues(M, [{tobydoc, S1}, {mattdoc, S2}, {andrewdoc, S3}]).
cell:addValues(S1, [this,that,other,him,her,belief]).
cell:addValues(S2, [that,other,him, species, left]).
cell:addValues(S3, [roy, blimp, him, her, species, clever]).

cell:injectIntercept(I, intercepts:construct(invert, [I, M])).
cell:injectOutput(M, {invert, [I]}, I).

cell:injectOutput(I, D).