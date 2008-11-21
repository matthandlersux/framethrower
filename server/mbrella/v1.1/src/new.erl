-module (new).
-compile (export_all).

-include ("../include/scaffold.hrl").

-define(d(Msg, Var), io:format("Error in ~s (~p):~n~s ~p~n~n", [?MODULE, self(), Msg, Var])).

%% ====================================================
%% API
%% ====================================================

%% 
%% ob(Parent) -> returns initialized ob record
%% 

ob(Parent) ->
	initOb(Parent).

%% 
%% situation() returns the Pid of a situation process
%% 
% -record (situation, {
% 	content,
% 	involves,
% 	parentSituation,
% 	correspondsIn,
% 	correspondsOut,
% 	childObjects,
% 	properties
% 	}).


situation(Parent) when is_pid(Parent) ->
	situation(initSituation(Parent));
situation(#ob{type = situation, content = Content, involves = Involves, parentSituation = ParentSituation, 
	correspondsIn = CorrespondsIn, correspondsOut = CorrespondsOut, childObjects = ChildObjects, 
	properties = Properties}) ->

	situation(Content, Involves, ParentSituation, CorrespondsIn, CorrespondsOut, ChildObjects, Properties).
	
situation(Content, Involves, ParentSituation, CorrespondsIn, CorrespondsOut, ChildObjects, Properties) ->
	spawn(fun() ->
		S = #ob{type = situation, content = Content, involves = Involves, parentSituation = ParentSituation, 
			correspondsIn = CorrespondsIn, correspondsOut = CorrespondsOut, childObjects = ChildObjects,
			properties = Properties},
		object:become(S)
	end).
	
%% 
%% outputPin() -> returns pid for an output pin
%%		an output pin just has a list of connections and a cache of messages passed to each of those pids
%%		
%% 

outputPin() ->
	pin:output().
	
%% 
%% startcap(Interface) -> creates new startcap
%% 

startcap(Interface) ->
	startcap:new(Interface).

%% 
%% interface(Type, SubType)
%% 

interface(Type, SubType) ->
	interface:new(Type, SubType).


%% ====================================================
%% process definitions
%% ====================================================



	
%% ====================================================
%% initialization functions
%% ====================================================

initOb(ParentSituation) ->
	#ob{content = initContent(), involves = initInvolves(), parentSituation = ParentSituation, 
		correspondsIn = initCorresponds(), correspondsOut = initCorresponds(), childObjects = initChildObjects(),
		properties = initProperties()}.
		
initSituation(ParentSituation) ->
	Ob = initOb(ParentSituation),
	Ob#ob{type = situation}.

% use ets hash table
initInvolves() ->
	startcap(interface(set, infon)).

initContent() ->
	startcap(interface(unit, xml)).

initCorresponds() ->
	[].

initChildObjects() ->
	startcap(interface(set, ob)).

initProperties() ->
	[].
	
%% ====================================================
%% utility functions
%% ====================================================

