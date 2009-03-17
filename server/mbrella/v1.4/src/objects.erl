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
				{"frameRate", "Number"},				
				{"duration", "Number"}
			]
		},
		#classToMake{
			name = "X.picture",
			inherit = "Object",
			prop = [
				{"url", "String"},
				{"width", "Number"},
				{"height", "Number"}
			]
		},
		#classToMake{
			name = "X.picture.crop",
			inherit = "Object",
			prop = [
				{"x", "Number"},
				{"y", "Number"},
				{"width", "Number"},
				{"height", "Number"}
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
		#classToMake{
			name = "X.xml",
			inherit = "Object",
			prop = [
				{"xml", "XML"}
			]
		},
		#classToMake{
			name = "X.time.range",
			inherit = "Object",
			prop = [
				{"start", "Number"},
				{"duration", "Number"}
			]
		},


		%% ====================================================
		%% UI
		%% ====================================================
	
		#classToMake{ name = "UI.ui",prop = [ {"screenWidth", "Unit Number"}, {"screenHeight", "Unit Number"}, {"mouseX", "Unit Number"}, {"mouseY", "Unit Number"}]}, 
		#classToMake{ name = "UI.main",prop = [ {"pane", "UI.pane"}, {"popup", "Map String UI.popup"}, {"dragging", "Unit UI.dragging"}]}, 
		#classToMake{ name = "UI.popup",prop = [ {"x", "Number"}, {"y", "Number"}, {"width", "Number"}, {"height", "Number"}, {"content", "Unit JS"}]}, 
		#classToMake{ name = "UI.dragging",prop = [ {"object", "Object"}]}, 
		#classToMake{ name = "UI.pane",prop = [ {"width", "Unit Number"}, {"height", "Unit Number"}]}, 
		#classToMake{ name = "UI.pane.set",inherit = "UI.pane", prop = [ {"panes", "Map String UI.pane"}, {"orientation", "Unit String"}]}, 
		#classToMake{ name = "UI.pane.timeline",inherit = "UI.pane", prop = [ {"focus", "Object"}, {"zoomWidth", "Unit Number"}, {"previewFrame", "Unit Number"}, {"selectedTime1", "Unit Number"}, {"selectedTime2", "Unit Number"}, {"selecting", "Unit Null"}]}, 
		#classToMake{ name = "UI.pane.pane",inherit = "UI.pane", prop = [ {"tab", "Unit String"}, {"focus", "Unit Object"}, {"propertiesState", "UI.propertiesState"}, {"aboutNewInfons", "Set UI.consIP"}, {"infonsInNewInfons", "Set UI.consIP"}, {"addingObject", "Unit Object"}, {"addingObjectPropertiesState", "UI.propertiesState"}]}, 
		#classToMake{ name = "UI.propertiesState",prop = [ {"editName", "Unit Null"}, {"typeExplorer", "Unit UI.outlineNode"}]}, 
		#classToMake{ name = "UI.consIP",prop = [ {"object", "Unit Object"}, {"left", "Unit UI.consIP"}, {"right", "Unit UI.consIP"}]}, 
		#classToMake{ name = "UI.outlineNode",prop = [ {"focus", "Object"}, {"children", "Map Object UI.outlineNode"}, {"expanded", "Unit Null"}]}, 
		#classToMake{ name = "UI.relationCreator.word",prop = [ {"string", "Unit String"}, {"type", "Unit Object"}]}, 
		#classToMake{ name = "UI.relationCreator",prop = [ {"typeExplorer", "UI.outlineNode"}, {"words", "Map String UI.relationCreator.word"}]}, 
		#classToMake{ name = "UI.prefs",prop = [ {"typeDisplay", "Map Object String"}, {"timelineLayers", "Map String Object"}]}
	].

makeRootObjects() ->
	objects:createWithName("Object", dict:new(), "shared.in"),

	objects:createWithName("Object", dict:new(), "shared.ont"),

	objects:createWithName("Object", dict:new(), "shared.isA"),
	objects:createWithName("Object", dict:new(), "shared.name"),
	objects:createWithName("Object", dict:new(), "shared.relationTemplate"),
	
	objects:createWithName("Object", dict:new(), "shared.video"),
	objects:createWithName("Object", dict:new(), "shared.videoTransitionsXML"),

	objects:createWithName("Object", dict:new(), "shared.thumbnail"),
	objects:createWithName("Object", dict:new(), "shared.picture.crop"),

	objects:createWithName("Object", dict:new(), "shared.isType"),
	objects:createWithName("Object", dict:new(), "shared.type"),

	objects:createWithName("Object", dict:new(), "shared.type.situation"),
	objects:createWithName("Object", dict:new(), "shared.type.entity"),
	objects:createWithName("Object", dict:new(), "shared.type.infon"),
	%% this will itself be used as a binary relation to make relation types
	objects:createWithName("Object", dict:new(), "shared.type.relation"), 

	objects:createWithName("Object", dict:new(), "shared.type.poly.a"),
	objects:createWithName("Object", dict:new(), "shared.type.movie"),
	objects:createWithName("Object", dict:new(), "shared.type.location"),
	objects:createWithName("Object", dict:new(), "shared.type.agent"),

	objects:createWithName("Object", dict:new(), "shared.realLife"),
	
	objects:createWithName("Object", dict:new(), "shared.movie.story"),
	objects:createWithName("Object", dict:new(), "shared.movie.presentation"),
	objects:createWithName("Object", dict:new(), "shared.movie.making"),
	
	objects:createWithName("Object", dict:new(), "shared.movie.timeRange"),
	
	objects:createWithName("Object", dict:new(), "shared.test.walleMovie"),
	ok.
	
	
%% ====================================================================
%% External functions
%% ====================================================================

start() -> 
	Server = gen_server:start({local, ?MODULE}, ?MODULE, [], []),
	%TODO: make classes and add properties
	ClassesToMake = classesToMake(),
	lists:map(fun (ClassDef) ->
		#classToMake{name = Name, inherit = Inherit, prop = Prop, memoize = Memoize} = ClassDef,
		makeClass(Name, Inherit, Memoize),
		lists:map(fun ({PropName, TypeString}) ->
			addProp(Name, PropName, TypeString)
		end, Prop),
		addMemoLookup(ClassDef)
	end, ClassesToMake),
	makeRootObjects(),
	Server.

stop() ->
	gen_server:call(?MODULE, stop).

makeClass(Name, Inherit, Memoize) ->
	gen_server:cast(?MODULE, {makeClass, Name, Inherit, Memoize}).

addProp(Name, PropName, TypeString) ->
	gen_server:cast(?MODULE, {addProp, Name, PropName, TypeString}).

createWithName(ClassName, Props, Name) ->
	try gen_server:call(?MODULE, {create, ClassName, Props, Name}) of
		Object -> Object
	catch
		ErrorType:ErrorPattern -> 
			{error, objectCreationError}
	end.	

create(ClassName, Props) ->
	try gen_server:call(?MODULE, {create, ClassName, Props, noname}) of
		Object -> Object
	catch
		ErrorType:ErrorPattern -> 
			{error, objectCreationError}
	end.

add(ObjOrPointer, Property, Key) ->
	Object = checkPointer(ObjOrPointer),
	Prop = Object#object.prop,
	Cell = dict:fetch(Property, Prop),
	cell:addLine(Cell, Key),
	ok.

remove(ObjOrPointer, Property, Key) ->
	Object = checkPointer(ObjOrPointer),
	Prop = Object#object.prop,
	Cell = dict:fetch(Property, Prop),
	cell:removeLine(Cell, Key),
	ok.

getBroadcaster(ClassName, MemoString) ->
	gen_server:call(?MODULE, {getBroadcaster, ClassName, MemoString}).

addToMemoTable(Obj, Prop) ->
	gen_server:cast(?MODULE, {addToMemoTable, Obj, Prop}).

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
	fun (ObjOrPointer) ->
		Obj = checkPointer(ObjOrPointer),
		CastingDict = Obj#object.castingDict,
		CastedObjName = dict:fetch(TargetClassName, CastingDict),
		#objectPointer{name = CastedObjName}
	end.

makeCastDown(TargetClassName, Classes) ->
	fun (ObjOrPointer) ->
		Obj = checkPointer(ObjOrPointer),
		OutputCell = cell:makeCell(),
		CastingDict = Obj#object.castingDict,
		case dict:find(TargetClassName, CastingDict) of
			error ->
				cell:done(OutputCell);
			{ok, CastedObjName} -> 
				CastedObj = #objectPointer{name = CastedObjName},
				cell:addLine(OutputCell, CastedObj),
				cell:done(OutputCell)
		end,
		OutputCell
	end.

inherits(SubClass, SuperClass) ->
	case SubClass of
		undefined -> false;
		SuperClass -> true;
		_ -> inherits(SubClass#class.inherit, SuperClass)
	end.


makeMemoString(MemoValues) ->
	lists:foldr(fun(Value, Acc) ->
		binary_to_list(mblib:exprElementToJson(Value)) ++ "," ++ Acc
	end, "", MemoValues).


makeRecursiveFunc(ListFunc, 0, AccList) -> ListFunc(AccList);
makeRecursiveFunc(ListFunc, ArgNum, AccList) ->
	fun(Arg) ->
		makeRecursiveFunc(ListFunc, ArgNum - 1, AccList ++ [Arg])
	end.

addMemoLookup(ClassDef) ->
	ClassName = ClassDef#classToMake.name,
	case ClassDef#classToMake.memoize of
		undefined -> ok;
		Memoize ->
			FuncName = ClassName ++ "::lookup",
			TypeStrings = lists:foldl(fun(PropName, Acc) -> 
				{_, {_,PropType}} = lists:keysearch(PropName, 1, ClassDef#classToMake.prop),
				Acc ++ "(" ++ PropType ++ ") -> "
			end, "", Memoize),
			FuncType = TypeStrings ++ "Unit " ++ ClassName,
			Func = makeRecursiveFunc(fun(ArgList) ->
				MemoString = makeMemoString(ArgList),
				getBroadcaster(ClassName, MemoString)
			end, length(Memoize), []),
			env:addFun(FuncName, FuncType, Func)
	end.

castPropsUpIfNeeded(Props, ObjClass, Classes) ->
	NewObjProps = dict:map(fun (PropName, PropType) ->
		case type:isReactive(PropType) of
			true ->
				reactive;
			false ->
				case dict:fetch(PropName, Props) of
					ObjectPointer when is_record(ObjectPointer, objectPointer) ->
						InstanceValue = env:lookup(ObjectPointer#objectPointer.name),
						InstanceType = type:get(InstanceValue),
						case type:compareTypes(InstanceType, PropType) of
							true -> ObjectPointer;
							false ->
								PropTypeString = atom_to_list(PropType#type.value),
								InstanceTypeString = atom_to_list(InstanceType#type.value),
								SubClass = dict:fetch(InstanceTypeString, Classes),
								SuperClass = dict:fetch(PropTypeString, Classes),
								Inherits = ((InstanceType#type.type == typeName) and (PropType#type.type == typeName) and inherits(SubClass, SuperClass)),
								case Inherits of
									true -> (SuperClass#class.castUp)(InstanceValue);
									false -> ?trace("Property Type Mismatch")
								end
						end;
					Prop -> Prop
				end
		end
	end, ObjClass#class.prop),
	case ObjClass#class.inherit of
		undefined -> NewObjProps;
		_ -> 
			InheritedProps = castPropsUpIfNeeded(Props, ObjClass#class.inherit, Classes),
			dict:merge(fun(_,V1,_)->V1 end, InheritedProps, NewObjProps)
	end.

makeFutureProps(Props, ObjClass, Classes) ->
	NewObjProps = dict:map(
		fun (PropName, PropType) ->
			case type:isReactive(PropType) of
				true ->
					PropCell = (cell:makeCell())#exprCell{type=PropType},
					cell:done(PropCell),
					cell:update(PropCell),
					PropCell;
				false ->
					PropValue = dict:fetch(PropName, Props),
					cell:makeFuture(PropValue)
			end
		end, ObjClass#class.prop),
	case ObjClass#class.inherit of
		undefined -> NewObjProps;
		_ -> 
			InheritedProps = makeFutureProps(Props, ObjClass#class.inherit, Classes),
			dict:merge(fun(_,V1,_)->V1 end, InheritedProps, NewObjProps)
	end.

%make dict of className to correctly typed copies of Obj for each inherited class, adding to env when made
makeInheritedCopies(Obj, Classes) ->
	ClassName = atom_to_list((Obj#object.type)#type.value),
	case (dict:fetch(ClassName, Classes))#class.inherit of
		undefined -> dict:new();
		UpClass ->
			UpClassName = UpClass#class.name,
			NewCopy = Obj#object{type = #type{type=typeName, value=list_to_atom(UpClassName)}},
			NewerCopy = env:nameAndStoreObj(NewCopy),
			Dict = makeInheritedCopies(NewerCopy, Classes),
			dict:store(UpClassName, NewerCopy, Dict)
	end.

checkPointer(ObjectOrPointer) ->
	case ObjectOrPointer of
		ObjectPointer when is_record(ObjectPointer, objectPointer) ->
			env:lookup(ObjectPointer#objectPointer.name);
		_ -> ObjectOrPointer
	end.

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
handle_call({create, ClassName, PropDict, InName}, From, State) ->
	Classes = State#state.classes,
	C = dict:fetch(ClassName, Classes),
	Props = castPropsUpIfNeeded(PropDict, C, Classes),
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
			Type = #type{type=typeName, value=list_to_atom(ClassName)},
			O = #object{type = Type},
			NewProps = makeFutureProps(Props, C, Classes),
			OWithProps = O#object{prop = NewProps},
			
			%add this obj to env
			NamedO = case InName of
				noname -> env:nameAndStoreObj(OWithProps);
				_ -> 
					env:store(InName, OWithProps),
					OWithProps#object{name=InName}
			end,
			
			%make dict of copies of this obj for each inherited class, adding to env when made
			%also include original in the dict
			InheritCopies = makeInheritedCopies(NamedO, Classes),
			Copies = dict:store(ClassName, NamedO, InheritCopies),
			
			%add dict of copy names to each copy and this obj, and update each obj in env
			CopyNames = dict:map(fun(_, Copy) ->
				Copy#object.name
			end, Copies),
			
			CopiesWithDict = dict:map(fun(CopyClassName, Copy) ->
				CopyName = Copy#object.name,
				CopyWithDict = Copy#object{castingDict = CopyNames},
				env:store(CopyName, CopyWithDict),
				CopyWithDict
			end, Copies),
			
			NewO = #objectPointer{name = NamedO#object.name},
			% NewO = dict:fetch(ClassName, CopiesWithDict),
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
	case dict:find(MemoString, MemoTable) of
		error -> 
			MemoEntry = (C#class.makeMemoEntry)(),
			NewMemoTable = dict:store(MemoString, MemoEntry, MemoTable);
		{ok, Entry} -> 
			MemoEntry = Entry,
			NewMemoTable = MemoTable
	end,
	Broadcaster = MemoEntry#memoEntry.broadcaster,
	NewC = C#class{memoTable = NewMemoTable},
	NewClasses = dict:store(ClassName, NewC, Classes),
	NewState = State#state{classes=NewClasses},
	{reply, Broadcaster, NewState};
handle_call(stop, _, State) ->
	{stop, normal, stopped, State}.


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
	NewClassWithoutCastDown = #class{
		name = Name, 
		inherit = case Inherit of 
			undefined -> undefined;
			_ -> dict:fetch(Inherit, Classes)
		end,
		memoize = Memoize,
		makeMemoEntry = fun() ->
			Broadcaster = (cell:makeCell())#exprCell{type=type:parse("Unit " ++ Name)},
			cell:done(Broadcaster),
			NewMemoEntry = #memoEntry{broadcaster = Broadcaster},
			NewMemoEntry
		end,
		castUp = Cast
	},
	TempClasses = dict:store(Name, NewClassWithoutCastDown, Classes),
	CastDown = 	makeCastDown(Name, TempClasses),
	NewClass = NewClassWithoutCastDown#class{castDown = CastDown},
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
	GetFunc = fun(ObjOrPointer) ->
		Obj = checkPointer(ObjOrPointer),
		dict:fetch(PropName, Obj#object.prop)
	end,
	env:addFun(GetFuncName, FuncType, GetFunc),
	NewState = State#state{classes=NewClasses},
	{noreply, NewState};
handle_cast({addToMemoTable, Obj, Props}, State) ->
	Classes = State#state.classes,
	ClassName = atom_to_list((Obj#object.type)#type.value),
	C = dict:fetch(ClassName, Classes),
	Memoize = C#class.memoize,
	MemoString = case Memoize of
		undefined -> undefined;
		_ ->
			MemoValues = lists:map(fun(PropName) ->
				dict:fetch(PropName, Props)
			end, Memoize),
			makeMemoString(MemoValues)
	end,		
	UpdatedState = case Memoize of
		undefined -> State;
		_ ->
			NewMemoTable = case dict:find(MemoString, C#class.memoTable) of
				error -> dict:store(MemoString, (C#class.makeMemoEntry)(), C#class.memoTable);
				_ -> C#class.memoTable
			end,
			Entry = dict:fetch(MemoString, NewMemoTable),
			NewEntry = Entry#memoEntry{object=Obj},
			NewerMemoTable = dict:store(MemoString, NewEntry, NewMemoTable),
			NewC = C#class{memoTable = NewerMemoTable},
			NewClasses = dict:store(ClassName, NewC, Classes),
			NewState = State#state{classes=NewClasses},
			
			Broadcaster = NewEntry#memoEntry.broadcaster,
			cell:addLine(Broadcaster, Obj),
			NewState
	end,
	{noreply, UpdatedState}.

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