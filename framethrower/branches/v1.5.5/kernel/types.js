
/*
Every type is of type typeType. Every type has a method match(instanceType)
match returns true if instanceType is a subtype of type,
	so kernel.ob.match(kernel.individual) is true but kernel.individual.match(kernel.ob) is false
*/

var typeType;
function makeType(name, isRootType) {
	var type;
	if (isRootType) {
		type = makeIded();
		type.getType = function () {
			return type;
		};
	} else {
		type = makeIded(typeType);
	}
	
	// default match method
	type.match = function (instanceType) {
		return type === instanceType;
	};
	
	type.getName = getter(name);
	
	return type;
}
typeType = makeType("typeType", true); // a little bit of circularity hacking...



// type error functions

function errorTypeMismatch(type, instanceType) {
	console.error("Type mismatch", type.getName(), instanceType.getName());
}

function typeCheck(type, instance) {
	if (DEBUG) {
		if (instance.getType) {
			if (!type.match(instance.getType())) {
				console.error("Type mismatch. Expected: " + type.getName() + " got: " + instance.getType().getName());
			}
		} else {
			if (type !== basic.js && type !== basic.bool && type !== basic.string) {
				console.error("Type mismatch with instance", type.getName(), instance);
			}
		}
	}
}



var basic = {};
basic.js = makeType("basic.js");

basic.string = makeType("basic.string");
basic.bool = makeType("basic.bool");
basic.xml = makeType("basic.xml");

/*basic.assoc = memoize(function (keyType, valueType) {
	
});*/


basic.fun = memoize(function () {
	var result = arguments[arguments.length - 1]; // last element of arguments
	var args = Array.prototype.splice.call(arguments, 0);
	args.splice(-1, 1); // args is all of arguments except the last element
	
	var type = makeType("(" + map(args, function (a) {return a.getName();}).join(", ") + " -> " + result.getName() + ")");
	
	type.getArguments = getter(args);
	type.getResult = getter(result);
	
	return type;
});

