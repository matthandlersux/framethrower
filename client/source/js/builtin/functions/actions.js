
function makeActionJavascript(f) {
	var action = {kind: "actionJavascript", f: f},
		lineAction = {actions: [{action: action}]};
	
	return makeActionClosure(lineAction, emptyEnv);
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
addFun("insert", "Set a -> a -> Action Void", function(s, x) {
	return makeActionJavascript( function() { updateCC("add", s, x); } );
});
addFun("remove", "Set a -> a -> Action Void", function(s, x) {
	return makeActionJavascript( function() { updateCC("remove", s, x); } );
});
addFun("map", "Map a b -> a -> b -> Action Void", function(m, k, v) {
	return makeActionJavascript( function() { updateCC("add", m, k, v); } );
});
addFun("unmap", "Map a b -> a -> Action Void", function(m, k) {
	return makeActionJavascript( function() { updateCC("remove", m, k); } );
});
