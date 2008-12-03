/*

An Object looks like:
{
	kind: "object",
	type: Type,
	prop: {propName:property}
}


A Class looks like:
{
	name: String
	prop: {propName:Type}
	inherit: Class
}
*/


var classes = {};

function makeClass(name, inherit) {
	classes[name] = {
		name: name,
		prop: {},
		inherit: inherit && classes[inherit]
	};
}

function addProp(name, propName, typeString) {
	classes[name].prop[propName] = parseType(typeString);
}

makeClass("K.object");

makeClass("K.cons", "K.object");

addProp("K.object", "involves", "Set K.cons");
addProp("K.cons", "relation", "K.object");
addProp("K.cons", "arg", "K.object");
addProp("K.cons", "truth", "Unit Bool"); // this only applies if the relation is "in (the context of)"





