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
	var cast = makeCast(name);
	classes[name] = {
		name: name,
		prop: {},
		inherit: inherit && classes[inherit],
		castUp: cast,
		castDown: makeCastDown(cast, name)
	};
	
	// add 2 casting functions to env for each inherited Class
	makeCasts(classes[name].inherit, name);
}

function makeCasts(superClass, targetClassName) {
	if (superClass !== undefined) {
		var superClassName = superClass.name;
		// Casting Up, example castUp: 'K.object.cast.K.cons'
		var castUpFuncName = targetClassName + ".cast." + superClassName;
		var castUpType = targetClassName + " -> " + superClassName;
		var castUpFunc = superClass.castUp;
		addFun(castUpFuncName, castUpType, castUpFunc);
		// Casting Down, example castDown: 'K.cons.cast.K.object'
		var castDownFuncName = superClassName + ".cast." + targetClassName;
		var castDownType = superClassName + " -> Unit " + targetClassName;
		var castDownFunc = superClass.castDown;
		addFun(castDownFuncName, castDownType, castDownFunc);

		makeCasts(superClass.inherit, targetClassName);
	}
}

function makeCast(targetClassName) {
	return function (obj) {
		return {
			kind: obj.kind,
			origType: obj.origType,
			type: {kind: "typeName", value: targetClassName},
			prop: obj.prop
		};
	};
}

function makeCastDown(cast, targetClassName) {
	return function (obj) {
		var outputCell = makeCell();
		if(inherits(classes[obj.origType.value], classes[targetClassName])) {
			outputCell.addLine(cast(obj));
		}
		return outputCell;
	};
}

function inherits(subClass, superClass) {
	if (subClass == superClass) {
		return true;
	} else if (subClass.inherit !== undefined) {
		return inherits(subClass.inherit, superClass);
	} else {
		return false;
	}
}

function addProp(name, propName, typeString) {
	classes[name].prop[propName] = parseType(typeString);

	// Get, example getFuncName: 'K.cons.getRelation' 
	var getFuncName = name + ".get" + capFirst(propName);
	var funcType = name + " -> " + typeString;
	var getFunc = function(obj) {
		return obj.prop[propName];
	};
	addFun(getFuncName, funcType, getFunc);

}

function addPropsToObject(props, obj, objClass) {
	// typecheck property for each property name in the Class and inherited Classes
	if (objClass) {
		forEach(objClass.prop, function (propType, propName) {
			if (props[propName] !== undefined) {
				if (getType(props[propName]).value == propType.value) {
					obj.prop[propName] = props[propName];
				} else {
					//throw type exception
					throw "Property type mismatch: `"+ unparseType(getType(props[propName])) +"` and `"+unparseType(propType)+"`";
				}
			}
		});
		addPropsToObject(props, obj, objClass.inherit);
	}
}

function makeObject(className, props) {
	var o = {
		kind: "object",
		origType: {kind: "typeName", value: className},
		type: {kind: "typeName", value: className},
		prop: {}
	};

	addPropsToObject(props, o, classes[className]);

	return o;
}

// ==================================================================
// Primitive Objects
// ==================================================================

makeClass("K.object");

makeClass("K.cons", "K.object");
makeClass("K.childOfCons", "K.cons");


addProp("K.object", "involvesLeft", "Set K.cons");
addProp("K.cons", "relation", "K.object");
addProp("K.cons", "arg", "K.object");
addProp("K.cons", "truth", "Unit Bool"); // this only applies if the relation is "in (the context of)"
addProp("K.cons", "involvesRight", "Set K.cons");

// ==================================================================
// UI
// ==================================================================


// ==================================================================
// External Representations
// ==================================================================

makeClass("X.video");
addProp("X.video", "url", "String");
addProp("X.video", "width", "Number");
addProp("X.video", "height", "Number");
addProp("X.video", "duration", "Number");

