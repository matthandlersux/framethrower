
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

function getType(instance) {
	if (!instance || instance === true) {
		return basic.bool;
	} else if (instance.getType) {
		return instance.getType();
	} else if (typeof instance === "string") {
		return basic.string;
	} else if (typeof instance === "number") {
		return basic.number;
	} else if (instance.nodeType) { // should use a better test here
		return basic.xml;
	} else {
		return basic.js;
	}
}

function getSuperType(instances) {
	var type = getType(instances[0]);
	forEach(instances, function (instance) {
		var instanceType = getType(instance);
		while (!type.match(instanceType)) {
			if (type.parent) {
				type = type.parent;
			} else {
				type = basic.js;
			}
		}
	});
	return type;
}

// this is just used for equals......
function getSuperTypeFromTypes() { //arguments
	var superType = arguments[0];
	forEach(arguments, function (type) {
		while (!superType.match(type)) {
			if (superType.parent) {
				superType = superType.parent;
			} else {
				superType = basic.js;
			}
		}
	});
	return superType;
}

function typeCheck(type, instance) {
	if (DEBUG) {
		var instanceType = getType(instance);
		if (!type.match(instanceType)) {
			console.error("Type mismatch. Expected: " + type.getName() + " got: " + instanceType.getName());
			console.log(instance.get.content().getState());
		}
	}
}



var basic = {};
basic.js = makeType("basic.js");
basic.string = makeType("basic.string");
basic.bool = makeType("basic.bool");
basic.number = makeType("basic.number");
basic.xml = makeType("basic.xml");

basic.js.match = function (instanceType) {
	return true;
	//return instanceType === basic.js || instanceType === basic.string || instanceType === basic.bool || instanceType === basic.number || instanceType === basic.xml;
};

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

basic.alt = memoize(function () {
	var args = arguments;
	
	var type = makeType("basic.alt(" + map(args, function (a) {return a.getName();}).join(", ") + ")");
	
	type.match = function (instanceType) {
		// this needs to be more nuanced
		return type === instanceType || any(args, function (arg) {
			return arg.match(instanceType);
		});
	};
	
	return type;
});


// this is for qt's (see parseXML.js qtDocs)
qtType = makeType("qt");
