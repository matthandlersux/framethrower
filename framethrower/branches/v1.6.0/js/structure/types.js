var types = {};

types["TypeType"] = {
	name: "TypeType"
};
types["TypeType"].type = types["TypeType"];


function makeType(name) {
	return {
		name: name,
		type: types.TypeType
	};
}

function makePrimitiveType(name) {
	types[name] = makeType(name, "types." + name);
}

makePrimitiveType("Bool");
makePrimitiveType("Number");
makePrimitiveType("String");

function makeReactiveType() {
	var args = Array.prototype.slice.call(arguments);
	var constructor = args[0];
	var msgs = args.shift();
	
	var constructorP = parse(constructor);
	var msgsP = map(args, parse);
	
	return function () {
		var params = {};
		forEach(arguments, function (arg, i) {
			params[constructorP[i+1]] = arg;
		});
		
		var t = makeType(constructorP[0] + " " + map(params, getProp("name")).join(" "));
	};
}

makeReactiveType("Unit a", "set a", "unset");
makeReactiveType("Set a", "add a", "remove a");
makeReactiveType("List a", "append a", "insert Number a", "remove Number a");
makeReactiveType("Assoc a b", "set a b", "remove a");








var getType = (function () {
	var typeNames = {
		"boolean": types.Bool,
		"number": types.Number,
		"string": types.String
	};
	return function (o) {
		var t = typeOf(o);
		if (typeNames[t]) {
			return typeNames[t];
		} else if (o.type) {
			return o.type;
		} else {
			// error?
		}
	};
})();

