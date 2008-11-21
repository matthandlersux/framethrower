-module (component).
-compile( export_all ).


	
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
	endcap:new( process:new(groupBy, Fun), assoc).
	
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
%% equals component takes an element and any input and returns bool if they're equal
%% 

equals(ObId) ->
	EqualsFun = fun({add, Ob}) ->
					if
						Ob =:= ObId -> true;
						true -> false
					end
				end,
	endcap:new( process:new( equals, EqualsFun), static ).


	


%% ====================================================
%%  components ----------------------------------------
%%		these functions act as the API to components
%%		they should be called with something the results in a fun({control, ob}) as the parameter
%% ====================================================

%% 
%% bindUnit component takes a function (a->unit(b)) and unit(a) and returns unit(b)
%% 	StaticFun(a) creates some group of boxes and functions and returns 
%% 

bindUnit(Fun) ->
	endcap:new( bindUnit, Fun, unit).

%% 
%% returnUnit takes a static value and makes it a unit reactive value, this component assumes
%%		you want to control a box with this function	
%% 

returnUnit(BoxToControl) ->
	ReturnUnitFun = fun(StaticValue) -> 
						endcap:control(BoxToControl, {add, StaticValue}),
						null
					end,
	endcap:new( returnUnit, fun() -> ReturnUnitFun end, endcap).

%% 
%% buildAssoc component takes a Fun(elements_of_set(a)) -> b where b is anything and creates a box such that
%%		set(a) -> box -> assoc(a,b)
%% 

buildAssoc(Fun) ->
	endcap:new( buildAssoc, Fun, assoc).

%% 
%% filter component takes a Fun(elements_of_set(a)) -> bool() and creates a box such that
%% 		set(a) -> box -> set(b) with b being all the elements that Fun -> true
%% 

filter(Fun) ->
	endcap:new( filter, Fun).

%% ====================================================
%% component library ----------------------------------
%% 		these functions get passed to the API functions and call the constructors
%% ====================================================

%% 
%% constructs necessry functions and plugs them into the constructor which returns fun({control, ob})
%% 

buildAssocOfCorrespondences() ->
	Self = self(),
	GatherFun = fun( Ob ) -> fun({Control, Ob2}) -> endcap:control(Self, {Control, {Ob, Ob2}}), {remove, {Ob, Ob2}} end end,
	ConnectFun = fun( Ob ) -> object:get(Ob, corresponds) end,
	CleanupFun = fun( Gatherer ) -> endcap:die(Gatherer, "Removed from set") end,
	buildAssocGeneral(GatherFun, ConnectFun, CleanupFun).
	
%% 
%% filterType is a filter component that only filters the type of objects specified
%% 

filterType(Type) ->
	FilterFun = fun({_, Ob}) -> 
					case object:get(Ob, type) of
						Type -> true;
						_ -> false
					end
				end,
	filterGeneral(FilterFun).
	
%% 
%% comment
%% 

groupBySubType({Control, Ob}) ->
	SubType = object:get(Ob, subType),
	{Control, {SubType, Ob}}.	
	
%% 
%% not component takes a unit(bool) and returns a unit(bool)
%% 

%% a function passed to bindUnit should take as its parameter the ID of its parent box and
%% 		pass its constructor function, connect function, and cleanup function to bindUnitGeneral

reactiveNot() ->
	Self = self(),
	StaticFun = fun(StaticValue) -> 
					Startcap = startcap:new( interface:new(static, bool) ),
					startcap:control( Startcap, StaticValue ),
					Box1 = endcap:new( 'not', fun() -> fun(Bool) -> not Bool end end, static),
					startcap:connect( Startcap, Box1 ),
					Box2 = returnUnit(Self),
					endcap:connect( Box1, Box2 ),
					Box2		
				end,
	bindUnitGeneral(StaticFun).

%% ====================================================
%% component constructors -----------------------------
%%		these functions are the general piping of the components
%% ====================================================

%% 
%% the general steps for a bindUnit fun
%%		call static function that connects to boxes output, return cleanup function
%% 

bindUnitGeneral(StaticFun) ->
	ParentBox = self(),
	ConnectFun = fun(Ob) -> endcap:connect(Ob, ParentBox) end,
	CleanupFun = fun(Ob) -> endcap:die(Ob, "Original Unit Changed") end,
	bindUnitGeneral(StaticFun, ConnectFun, CleanupFun).
	
bindUnitGeneral(StaticFun, ConnectFun, CleanupFun) ->
	fun({add, Ob}) ->
		StaticOutputId = StaticFun(Ob),
		ConnectFun(StaticOutputId),
		{null, fun() -> CleanupFun( StaticOutputId ) end }
	end.
%% 
%% bindSetGeneral takes a foreach element StaticFun and builds a scaffold that adds its elements to the main
%%		box
%% 
bindSetGeneral(StaticFun) ->
	ParentBox = self(),
	ConnectFun = fun(Ob) -> endcap:connect(Ob, ParentBox) end,
	CleanupFun = fun(Ob) -> endcap:die(Ob, "Original Set Removed Item") end,
	bindSetGeneral(StaticFun, ConnectFun, CleanupFun).
	
bindSetGeneral(StaticFun, ConnectFun, CleanupFun) ->
	fun({add, Ob}) ->
		StaticOutputId = StaticFun(Ob),
		ConnectFun(StaticOutputId),
		{null, fun() -> CleanupFun( StaticOutputId ) end };
	({remove, Ob}) ->
		{null, terminate}
	end.

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
%% the gatherer is a component that takes an input and uses that to control a parent box
%% 

gatherer(GatherFun) ->
	endcap:new( gatherer, fun() -> GatherFun end, endcap ).
	
%% 
%% filterGeneral takes the filter function and generates the necessary stuff
%% 

filterGeneral(FilterFun) ->
	null.