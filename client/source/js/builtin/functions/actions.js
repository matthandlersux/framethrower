
// used by builtin actions below, and also by desugar of jsaction() syntax:
function makeActionJavascript(f) {
	var action = {kind: "actionJavascript", f: f}, // will be interpreted by executeAction()
		lineAction = {actions: [{action: action}]};
	
	return makeInstruction(lineAction, emptyEnv);
}

addFun("return", "a -> Action a", function(x) {
	return makeActionJavascript( function() {return x;} );
});


function updateCC(updateType, target, key, value) {
	if (target.control === undefined) {
		debug.error("Trying to do action update on non-controlled cell", target);
	} else {
		target.control[updateType](key, value);
	}
}

addFun("set", "Unit a -> a -> Action Void", function(u, x) {
	return makeActionJavascript( function() { updateCC("add", u, x); } );
});
addFun("unset", "Unit a -> Action Void", function(u) {
	return makeActionJavascript( function() { updateCC("remove", u); } );
});
addFun("add", "Set a -> a -> Action Void", function(s, x) {
	return makeActionJavascript( function() { updateCC("add", s, x); } );
});
addFun("remove", "Set a -> a -> Action Void", function(s, x) {
	return makeActionJavascript( function() { updateCC("remove", s, x); } );
});
addFun("addEntry", "Map a b -> a -> b -> Action Void", function(m, k, v) {
	return makeActionJavascript( function() { updateCC("add", m, k, v); } );
});
addFun("removeEntry", "Map a b -> a -> Action Void", function(m, k) {
	return makeActionJavascript( function() { updateCC("remove", m, k); } );
});
