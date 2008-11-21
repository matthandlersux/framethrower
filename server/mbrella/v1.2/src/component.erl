-module (component).
-compile( export_all ).

%% 
%% filter component takes a Fun(elements_of_set(a)) -> bool() and creates a box such that
%% 		set(a) -> box -> set(b) with b being all the elements that Fun -> true
%% 

filter(Fun) ->
	box:new( process:new(filter, Fun) ).
	
% example:
% 
% filter all objects of type infon from a set
% 
% filterInfons({_, Ob}) ->
% 	case object:get(Ob, type) of 
% 		infon -> true;
% 		_ -> false
% 	end.
% 
% note, this needs a cross reference set up unless the box knows to make the output-startcap a bag

		
%% 
%% groupBy component takes a Fun(elements_of_set(a)) -> b where b is a key and creates a box such that 
%%		set(a) -> box -> assoc(b,a) with b being the key and a being elements of the input set
%% 

groupBy(Fun) ->
	box:new( process:new(groupBy, Fun), assoc).
	
% example:
% 
% group objects by subtype
% 
% groupBySubType({Control, Ob}) ->
% 	SubType = object:get(Ob, subType),
% 	{Control, {SubType, Ob}}.
%% 
%% ### NOTE that this is not reactive in the sense that if the subType of an object changes, 
%%		the process doesnt know about it--this could mean that type/subtype should be startcaps
%% 


%% 
%% buildAssoc component takes a Fun(elements_of_set(a)) -> b where b is anything and creates a box such that
%%		set(a) -> box -> assoc(a,b)
%% 

buildAssoc(Fun) ->
	Process = process:new(buildAssoc, fun(X) -> X end),
	Box = box:new( Process, assoc),
	process:replace(Process, Fun(Box) ),
	Box.
	
% example:
% 
% build associative array of objects and their correspondences
% 
% buildAssocOfCorrespondences({Control, Ob}) ->
% 	ParentBox = process:get(self(), parentBox),
% 	% build a box that listens for correspondence updates from Ob and push them to the assoc of the startcap
% 	Gatherer = box:new( process:new(grouper, fun({Control, Ob2}) -> box:control(ParentBox, {control, {Control, {Ob, Ob2}}}), null end)),
% 	startcap:connect( object:get(Ob, corresponds), Gatherer),
% 	box:ambient(ParentBox, Gatherer),
% 	null.

gatherer(GatherFun) ->
	box:new( process:new(gatherer, GatherFun), endcap ).
	
%% 
%% equals component takes an element and any input and returns bool if they're equal
%% 

equals(ObId) ->
	EqualsFun = fun({add, Ob}) ->
					if
						Ob =:= ObId -> true;
						true -> false
					end
				end,
	box:new( process:new( equals, EqualsFun), static ).

%% 
%% returnUnit takes a static value and makes it a unit reactive value
%% 
returnUnit(BoxToControl) ->
	ReturnUnitFun = fun(StaticValue) -> 
						box:control(BoxToControl, {add, StaticValue}),
						null
					end,
	box:new( process:new( returnUnit, ReturnUnitFun), endcap).
	
%% 
%% not component takes a unit(bool) and returns a unit(bool)
%% 

%% a function passed to bindUnit should take as its parameter the ID of its parent box and
%% 		pass its constructor function, connect function, and cleanup function to bindUnitGeneral

reactiveNot(ParentBox) ->
	StaticFun = fun(StaticValue) -> 
					Startcap = startcap:new( interface:new(static, bool) ),
					startcap:control( Startcap, StaticValue ),
					Box1 = box:new( process:new( fun(Bool) -> not Bool end ), static),
					startcap:connect( Startcap, Box1 ),
					Box2 = returnUnit(ParentBox),
					box:connect( Box1, Box2 ),
					Box2		
				end,
	bindUnitGeneral(StaticFun, ParentBox).
	
%% 
%% bindUnit component takes a function (a->unit(b)) and unit(a) and returns unit(b)
%% 	StaticFun(a) creates some group of boxes and functions and returns 
%% 

bindUnit(Fun) ->
	Process = process:new(bindUnit, fun(X) -> X end),
	Box = box:new( Process, unit),
	process:replace( Process, Fun(Box) ),
	Box.
	
%% 
%% the general steps for a bindUnit fun
%%		call static function that connects to boxes output, return cleanup function
%% 

bindUnitGeneral(StaticFun, ParentBox) ->
	ConnectFun = fun(Ob) -> box:connect(Ob, ParentBox) end,
	CleanupFun = fun(Ob) -> box:die(Ob, "Original Set Changed") end,
	bindUnitGeneral(StaticFun, ConnectFun, CleanupFun).
	
bindUnitGeneral(StaticFun, ConnectFun, CleanupFun) ->
	fun({add, Ob}) ->
		StaticOutputId = StaticFun(Ob),
		ConnectFun(StaticOutputId),
		{null, fun() -> CleanupFun( StaticOutputId ) end }
	end.

%% ====================================================
%% Pluggable Functions
%% ====================================================

%% 
%% filterType is a filter component that only filters the type of objects specified
%% 

filterType(Type) ->
	box:new( process:new(filterType, 
		fun({_, Ob}) -> 
			case object:get(Ob, type) of
				Type -> true;
				_ -> false
			end
		end) ).
		

	
groupBySubType({Control, Ob}) ->
	SubType = object:get(Ob, subType),
	{Control, {SubType, Ob}}.	

%% 
%% the general steps for a buildAssoc Component
%% create collection boxes, connect them to informants, return cleanup
%% 
	
buildAssocGeneral(GatherFun, ConnectFun, CleanupFun) ->
	fun({add, Ob}) ->
		Gatherer = gatherer( GatherFun( Ob )),
		startcap:connect( ConnectFun(Ob), Gatherer ),
		{null, fun() -> CleanupFun( Gatherer ) end};
	({remove, _}) ->
		{null, terminate}
	end.

%% 
%% a possible implementation for assoc by correspondences
%% 

buildAssocOfCorrespondences(ParentBox) ->
	GatherFun = fun( Ob ) -> fun({Control, Ob2}) -> box:control(ParentBox, {Control, {Ob, Ob2}}), {remove, {Ob, Ob2}} end end,
	ConnectFun = fun( Ob ) -> object:get(Ob, corresponds) end,
	CleanupFun = fun( Gatherer ) -> box:die(Gatherer, "Removed from set") end,
	buildAssocGeneral(GatherFun, ConnectFun, CleanupFun).

% buildAssocOfCorrespondences(ParentBox) ->
% 	fun({add, Ob}) ->
% 		% build a box that listens for correspondence updates from Ob and push them to the assoc of the startcap
% 		Gatherer = box:new( process:new(gatherer, fun({Control2, Ob2}) -> 
% 													box:control(ParentBox, {Control2, {Ob, Ob2}}),
% 													null
% 												end)),
% 		startcap:connect( object:get(Ob, corresponds), Gatherer), % this is the main component of the function
% 		% box:ambient(ParentBox, Gatherer),
% 		% return a cleanup function that is used when ParentBox receives {remove, Ob}
% 		{null, fun() -> box:die(Gatherer, "Removed from set") end};
% 		% {null, fun() -> box:disconnect(Gatherer, ParentBox) end}; may be better on more complicated functions
% 	({remove, _}) ->
% 		{null, terminate}
% 	end.