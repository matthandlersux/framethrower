var tempGlobalDots;

addFun("return", "a -> Action a", function(x) {
	return makeActionMethod( function() {return x;} );
});

addFun("set", "Unit a -> a -> Action Void", function(u, x) {
	return makeActionMethod( function() { updateCC("add", u, x); } );
});
addFun("unset", "Unit a -> Action Void", function(u) {
	return makeActionMethod( function() { 
		updateCC("remove", u); 
	} );
});
addFun("add", "Set a -> a -> Action Void", function(s, x) {
	return makeActionMethod( function() { updateCC("add", s, x); } );
});
addFun("remove", "Set a -> a -> Action Void", function(s, x) {
	return makeActionMethod( function() { updateCC("remove", s, x); } );
});
addFun("addEntry", "Map a b -> a -> b -> Action Void", function(m, k, v) {
	return makeActionMethod( function() { updateCC("add", m, k, v); } );
});
addFun("removeEntry", "Map a b -> a -> Action Void", function(m, k) {
	return makeActionMethod( function() { updateCC("remove", m, k); } );
});


function updateCC(updateType, target, key, value) {
	if (target.control === undefined) {
		debug.error("Trying to do action update on non-controlled cell", target);
	} else {
		//if (key !== undefined) key = evaluate(key);
		//if (value !== undefined) value = evaluate(value);
		target.control[updateType](key, value);
	}
}
