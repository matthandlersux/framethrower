
/*
Every type is of type typeType. Every type has at least these two methods: match and assign.
Match takes an instanceType (a type to compare against) and if the types do not match, returns false.
	If the types do match, it returns an object where the keys are type variables and the values are the types that those type variables must be for the instanceType to match the original type.
Assign takes an object (the result of a match), and returns a type where type variables of those names are assigned with the appropriate type.
*/

function errorTypeMismatch(type, instanceType) {
	throw "error: type mismatch";
}

var typeType;
function makeType(isRootType) {
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
	
	return type;
}
typeType = makeType(true); // a little bit of circularity hacking...



function typeCheck(type, instance) {
	if (DEBUG) {
		if (instance.getType) {
			type.match(instance.getType());
		} else {
			if (type !== basic.js) {
				errorTypeMismatch(type, instance);
			}
		}
	}
}



var basic = {};
basic.js = makeType();

basic.string = makeType();
basic.bool = makeType();
basic.xml = makeType();

basic.assoc = memoize(function (keyType, valueType) {
	
});


basic.poly = memoize(function (s) {
	var type = makeType();
	
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


