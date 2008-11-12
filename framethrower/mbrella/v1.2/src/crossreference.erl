-module (crossreference).
-compile (export_all).

%% --------------------------------------------------------------------
%% Include files
%% --------------------------------------------------------------------

-include ("../include/scaffold.hrl").



new() ->
	#crossReference{}.
	
new(Type) ->
	#crossReference{type = Type, score = undefined, controller = fun() -> null end}.
	
control(#crossReference{type = unit, controller = OldCleanupFun} = CrossReference, {{add, Ob}, NewCleanupFun}) ->
	if 
		is_list(OldCleanupFun) -> lists:foreach(fun(CFun) -> CFun() end, OldCleanupFun);
		true -> OldCleanupFun()
	end,
	mblib:recordReplace(CrossReference, controller, NewCleanupFun);	
control(#crossReference{score = Score, controller = Controller} = CrossReference, {{add, Ob}, ControlFun}) ->
	Score1 = interface:control(Score, {add, Ob}),
	Controller1 = interface:control(Controller, {add, {Ob, ControlFun}}),
	mblib:recordReplace(CrossReference, [{score, Score1}, {controller, Controller1}]);
	% CrossReference#crossReference{score = Score1, controller = Controller1};
control(#crossReference{score = Score, controller = Controller} = CrossReference, {{remove, Ob}, terminate}) ->
	case interface:get(Score, Ob) of
		1 ->
			ControlFun = interface:get(Controller, Ob),
			if 
				is_list(ControlFun) -> lists:foreach(fun(CFun) -> CFun() end, ControlFun);
				true -> ControlFun()
			end,
			Score1 = interface:control(Score, {remove, Ob}),
			Controller1 = interface:control(Controller, {remove, Ob});
		Num ->
			Controller1 = Controller,
			Score1 = interface:control(Score, {remove, Ob})
	end,
	mblib:recordReplace(CrossReference, [{score, Score1}, {controller, Controller1}]).
	% CrossReference#crossReference{score = Score1, controller = Controller1}.