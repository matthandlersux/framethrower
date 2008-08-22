
/*
Every type is of type typeType. Every type has at least these two methods: match and assign.
Match takes an instanceType (a type to compare against) and if the types do not match, throws an error ("Type mismatch").
	If the types do match, it returns an object where the keys are type variables and the values are the types that those type variables must be for the instanceType to match the original type.
Assign takes an object (the result of a match), and returns a type where type variables of those names are assigned with the appropriate type.
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
	
	type.match = function (instanceType) {
		if (type === instanceType) {
			return {};
		} else {
			errorTypeMismatch(type, instanceType);
		};
	};
	type.assign = function (o) {
		return type;
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
			type.match(instance.getType());
		} else {
			if (type !== basic.js) {
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





basic.poly = memoize(function (s) {
	var type = makeType('"' + s + '"');
	
	type.match = function (instanceType) {
		var ret = {};
		ret[s] = instanceType;
		return ret;
	};
	type.assign = function (o) {
		if (o[s]) {
			return o[s];
		} else {
			return type;
		}
	};
	
	return type;
});


