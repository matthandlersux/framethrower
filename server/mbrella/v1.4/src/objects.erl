%%% -------------------------------------------------------------------
%%% Author  : andrew dailey
%%% Description : a cell is a collection of dots...
%%%
%%% -------------------------------------------------------------------
-module(objects).

-behaviour(gen_server).
-include("../include/scaffold.hrl").
-include ("../../../lib/ast.hrl").

-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X])).

%% --------------------------------------------------------------------
%% External exports
%-export([injectFunc/2]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

%%For now, export all
-compile(export_all).


%% ====================================================================
%% internal data structure records
%% ====================================================================
-record(state, {classes=dict:new()}).
-record(class, {name, prop=dict:new(),inherit,memoize,memoTable=dict:new(),castUp,castDown,makeMemoEntry}).
-record(memoEntry, {broadcaster, object}).

-record(classToMake, {name, inherit, prop, memoize}).

%% ====================================================
%% Types
%% ====================================================

%% 
%% Value:: Nat | Bool | String | Cell | {Value, Value}
%% Cell:: Pid
%% Pid:: < Nat . Nat . Nat >
%% 


classesToMake() ->
	[
		%% ====================================================
		%% Core
		%% ====================================================
		#classToMake{
			name="Object",
			prop= [
				{"upLeft", "Set Cons"},
				{"upRight", "Set Cons"}
			]
		},
		#classToMake{
			name = "Cons",
			inherit = "Object",
			prop = [
				{"left", "Object"},
				{"right", "Object"},
				{"truth", "Unit Null"}
			],
			memoize= ["left", "right"]
		},

		%% ====================================================
		%% External Representations
		%% ====================================================

		#classToMake{
			name = "X.video",
			inherit = "Object",
			prop = [
				{"url", "String"},
				{"width", "Number"},
				{"height", "Number"},
				{"duration", "Number"}
			]
		},
		#classToMake{
			name = "X.text",
			inherit = "Object",
			prop = [
				{"string", "String"}
			],
			memoize = ["string"]
		},

		%% ====================================================
		%% UI
		%% ====================================================
		#classToMake{
			name = "UI.prefs",
			prop = [
				{"typeDisplay", "Map Object String"}
			]
		}
	].



%% ====================================================================
%% External functions
%% ====================================================================

start() -> 
	Server = gen_server:start({local, ?MODULE}, ?MODULE, [], []),
	%TODO: make classes and add properties
	ClassesToMake = classesToMake(),
	lists:map(fun (#classToMake{name = Name, inherit = Inherit, prop = Prop, memoize = Memoize}) ->
		makeClass(Name, Inherit, Memoize),
		lists:map(fun ({PropName, TypeString}) ->
			addProp(Name, PropName, TypeString)
		end, Prop)
	end, ClassesToMake),
	Server.

stop() ->
	gen_server:call(?MODULE, stop).

makeClass(Name, Inherit, Memoize) ->
	gen_server:cast(?MODULE, {makeClass, Name, Inherit, Memoize}).

addProp(Name, PropName, TypeString) ->
	gen_server:cast(?MODULE, {addProp, Name, PropName, TypeString}).

create(ClassName, Props) ->
	gen_server:call(?MODULE, {create, ClassName, Props}).

add(Object, Property, Key) ->
	Prop = Object#object.prop,
	Cell = dict:fetch(Property, Prop),
	cell:addLine(Cell, Key).

remove(Object, Property, Key) ->
	Prop = Object#object.prop,
	Cell = dict:fetch(Property, Prop),
	cell:removeLine(Cell, Key).

getBroadcaster(ClassName, MemoString) ->
	gen_server:call(?MODULE, {getBroadcaster, ClassName, MemoString}).


%% ====================================================================
%% Internal functions
%% ====================================================================
makeCasts(undefined, _) -> done;
makeCasts(SuperClass, TargetClass) ->
	SuperClassName = SuperClass#class.name,
	TargetClassName = TargetClass#class.name,
	CastUpFuncName = TargetClassName ++ [$~] ++ SuperClassName,
	CastUpType = TargetClassName ++ " -> " ++ SuperClassName,
	CastUpFunc = SuperClass#class.castUp,
	env:addFun(CastUpFuncName, CastUpType, CastUpFunc),
	
	CastDownFuncName = SuperClassName ++ [$~] ++ TargetClassName,
	CastDownType = SuperClassName ++ " -> Unit " ++ TargetClassName,
	CastDownFunc = TargetClass#class.castDown,
	env:addFun(CastDownFuncName, CastDownType, CastDownFunc),
	
	makeCasts(SuperClass#class.inherit, TargetClass).

makeCast(TargetClassName) ->
	fun (Obj) -> 
		#object{
			origType = Obj#object.origType,
			type = #type{type = typeName, value = TargetClassName},
			prop = Obj#object.prop
		}
	end.

makeCastDown(Cast, TargetClassName, Classes) ->
	fun (Obj) ->
		OutputCell = cell:makeCell(),
		Inherits = inherits(dict:fetch((Obj#object.origType)#type.value, Classes), dict:fetch(TargetClassName, Classes)),
		if Inherits ->
			cell:addLine(OutputCell, Cast(Obj))
		end,
		OutputCell
	end.

inherits(SubClass, SuperClass) ->
	case SubClass of
		undefined -> false;
		SuperClass -> true;
		_ -> inherits(SubClass#class.inherit, SuperClass)
	end.


%TODO make memoization stuff work
makeMemoString(MemoValues) ->
	?trace(MemoValues),
	lists:foldl(fun(Value, Acc) ->
		%% Why does to_atom return binary and not atom?
		binary_to_list(mblib:to_atom(Value)) ++ "," ++ Acc
	end, "", MemoValues).


makeRecursiveFunc(ListFunc, 0, AccList) -> ListFunc(AccList);
makeRecursiveFunc(ListFunc, ArgNum, AccList) ->
	fun(Arg) ->
		makeRecursiveFunc(ListFunc, ArgNum - 1, [Arg | AccList])
	end.

addMemoLookup(ClassDef) ->
	ClassName = ClassDef#classToMake.name,
	case ClassDef#classToMake.memoize of
		undefined -> ok;
		Memoize ->
			FuncName = ClassName ++ "::lookup",
			TypeStrings = lists:foldl(fun(PropName, Acc) -> 
				PropType = dict:fetch(PropName, ClassDef#classToMake.prop),
				Acc ++ "(" ++ PropType ++ ") -> "
			end, "", Memoize),
			FuncType = TypeStrings ++ "Unit " ++ ClassName,
			Func = makeRecursiveFunc(fun(ArgList) ->
				MemoString = makeMemoString(ArgList),
				getBroadcaster(ClassName, MemoString)
			end, length(Memoize), []),
			env:addFun(FuncName, FuncType, Func)
	end.



addPropsToObject(Props, Obj, ObjClass, Classes) ->
	NewObjProps = dict:fold(
		fun (PropName, PropType, ObjProps) ->
			case type:isReactive(PropType) of
				true ->
					PropCell = (cell:makeCell())#exprCell{type=PropType},
					dict:store(PropType, PropCell, ObjProps);
				false ->
					InstanceValue = dict:fetch(PropName, Props),
					InstanceType = type:get(InstanceValue),
					PropValue = case type:compareTypes(InstanceType, PropType) of
						true -> InstanceValue;
						false ->
							PropTypeString = atom_to_list(PropType#type.value),
							SubClass = dict:fetch(InstanceType#type.value, Classes),
							SuperClass = dict:fetch(PropTypeString, Classes),
							Inherits = ((InstanceType#type.type == typeName) and (PropType#type.type == typeName) and inherits(SubClass, SuperClass)),
							if
								Inherits -> (SuperClass#class.castUp)(dict:fetch(PropName, Props));
								true -> ?trace("Property Type Mismatch")
							end
					end,
					dict:store(PropName, cell:makeFuture(PropValue), ObjProps)
			end
		end, Obj#object.prop, ObjClass#class.prop),
	NewerObjProps = case ObjClass#class.inherit of
		undefined -> NewObjProps;
		_ -> addPropsToObject(Props, Obj, ObjClass#class.inherit, Classes)
	end,
	Obj#object{prop = NewerObjProps}.



%% ====================================================================
%% Server functions
%% ====================================================================

init([]) ->
	process_flag(trap_exit, true),
    {ok, #state{}}.

%% --------------------------------------------------------------------
%% Function: handle_call/3
%% Description: Handling call messages
%% Returns: {reply, Reply, State}          |
%%          {reply, Reply, State, Timeout} |
%%          {noreply, State}               |
%%          {noreply, State, Timeout}      |
%%          {stop, Reason, Reply, State}   | (terminate/2 is called)
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_call({create, ClassName, Props}, From, State) ->
	Classes = State#state.classes,
	C = dict:fetch(ClassName, Classes),
	Memoize = C#class.memoize,
	{MemoString, MemoObject} = case Memoize of
		undefined -> {undefined, undefined};
		_ -> 
			MemoValues = lists:map(fun(PropName) ->
				dict:fetch(PropName, Props)
			end, Memoize),
			MemoS = makeMemoString(MemoValues),
			MemoO = case dict:find(MemoS, C#class.memoTable) of
				error -> undefined;
				{ok, MemoEntry} -> 
					MemoEntry#memoEntry.object
			end,
			{MemoS, MemoO}
	end,

	{NewObj, UpdatedState} = case MemoObject of
		undefined ->
			Type = #type{type=typeName, value=ClassName},
			O = #object{origType = Type, type = Type},
			OWithProps = addPropsToObject(Props, O, C, Classes),
			NewO = env:nameAndStoreObj(OWithProps),
			case Memoize of
				undefined -> {NewO, State};
				_ ->
					NewMemoTable = case dict:find(MemoString, C#class.memoTable) of
						error -> dict:store(MemoString, (C#class.makeMemoEntry)(), C#class.memoTable);
						_ -> C#class.memoTable
					end,
					Entry = dict:fetch(MemoString, NewMemoTable),
					NewEntry = Entry#memoEntry{object=NewO},
					NewerMemoTable = dict:store(MemoString, NewEntry, NewMemoTable),
					NewC = C#class{memoTable = NewerMemoTable},
					NewClasses = dict:store(ClassName, NewC, Classes),
					NewState = State#state{classes=NewClasses},
					
					Broadcaster = NewEntry#memoEntry.broadcaster,
					cell:addLine(Broadcaster, NewO),
					{NewO, NewState}
			end;
		Answer -> {Answer, State}
	end,
    {reply, NewObj, UpdatedState};
handle_call({getBroadcaster, ClassName, MemoString}, From, State) ->
	Classes = State#state.classes,
	C = dict:fetch(ClassName, Classes),
	MemoTable = C#class.memoTable,
	NewMemoTable = case dict:find(MemoString, MemoTable) of
		error -> dict:store(MemoString, (C#class.makeMemoEntry)(), MemoTable);
		_ -> MemoTable
	end,
	Broadcaster = NewMemoTable#memoEntry.broadcaster,
	NewC = C#class{memoTable = NewMemoTable},
	NewClasses = dict:store(ClassName, NewC, Classes),
	NewState = State#state{classes=NewClasses},
	{reply, Broadcaster, NewState}.


%% --------------------------------------------------------------------
%% Function: handle_cast/2
%% Description: Handling cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_cast({makeClass, Name, Inherit, Memoize}, State) ->
	#state{classes=Classes} = State,
	Cast = makeCast(Name),
	NewClass = #class{
		name = Name, 
		inherit = case Inherit of 
			undefined -> undefined;
			_ -> dict:fetch(Inherit, Classes)
		end,
		memoize = Memoize,
		makeMemoEntry = fun() ->
			Broadcaster = (cell:makeCell())#exprCell{type=type:parse("Unit " ++ Name)},
			NewMemoEntry = #memoEntry{broadcaster = Broadcaster},
			NewMemoEntry
		end,
		castUp = Cast,
		castDown = makeCastDown(Cast, Name, Classes)
	},
	makeCasts(NewClass#class.inherit, NewClass),
	NewClasses = dict:store(Name, NewClass, Classes),
	NewState = #state{classes=NewClasses},
    {noreply, NewState};
handle_cast({addProp, Name, PropName, TypeString}, State) ->
	Classes = State#state.classes,
	Type = type:parse(TypeString),
	Class = dict:fetch(Name, Classes),
	NewProps = dict:store(PropName, Type, Class#class.prop),
	NewClasses = dict:store(Name, Class#class{prop = NewProps}, Classes),
	GetFuncName = Name ++ ":" ++ PropName,
	FuncType = case type:isReactive(Type) of
		true -> Name ++ " -> (" ++ TypeString ++ ")";
		false -> Name ++ " -> Future (" ++ TypeString ++ ")"
	end,
	GetFunc = fun(Obj) ->
		dict:fetch(PropName, Obj#object.prop)
	end,
	env:addFun(GetFuncName, FuncType, GetFunc),
	NewState = State#state{classes=NewClasses},
	{noreply, NewState}.


%% --------------------------------------------------------------------
%% Function: handle_info/2
%% Description: Handling all non call/cast messages
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%% --------------------------------------------------------------------
handle_info({data, Data}, State) ->
	handle_cast({data, Data}, State),
    {noreply, State};
handle_info({get, state}, State) ->
	{reply, State, State}.

%% --------------------------------------------------------------------
%% Function: terminate/2
%% Description: Shutdown the server
%% Returns: any (ignored by gen_server)
%% --------------------------------------------------------------------
terminate(Reason, State) ->
    ok.

%% --------------------------------------------------------------------
%% Func: code_change/3
%% Purpose: Convert process state when code is changed
%% Returns: {ok, NewState}
%% --------------------------------------------------------------------
code_change(OldVsn, State, Extra) ->
    {ok, State}.