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
		var castUpFuncName = targetClassName + "~" + superClassName;
		var castUpType = targetClassName + " -> " + superClassName;
		var castUpFunc = superClass.castUp;
		addFun(castUpFuncName, castUpType, castUpFunc);
		// Casting Down, example castDown: 'K.cons.cast.K.object'
		var castDownFuncName = superClassName + "~" + targetClassName;
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
	var getFuncName = name + ":" + propName;
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
				if (getType(props[propName]).value == propType.value) { // TODO: replace this with compareTypes
					obj.prop[propName] = props[propName];
				} else {
					obj.prop[propName] = classes[propType.value].castUp(props[propName]);
					//throw type exception
					//throw "Property type mismatch: `"+ unparseType(getType(props[propName])) +"` and `"+unparseType(propType)+"`";
				}
			} else {
				// use the default, that is an empty controlled cell
				if (propType.kind === "typeApply") {
					obj.prop[propName] = makeCC(propType);
				} else {
					throw "Property needs to be defined: "+propName;
				}
			}
		});
		addPropsToObject(props, obj, objClass.inherit);
	}
}

var memoTable = {};

function getMemoString(className, props) {
	var classObj = classes[className];
	var memoString = className + "=";
	forEach(props, function(prop, propName) {
		if (!isReactive(classObj.prop[propName])) {
			memoString += propName + ":" + stringify(prop) + ";";
		}
	});
	return memoString;
}

function makeObject(className, props) {
	//check memoization table - only for K.cons for now. Later we will annotate classes with how to memoize them
	if(className === "K.cons" && props !== undefined) {
		console.log("PROPS", props);
		var memoObject = memoTable[getMemoString(className, props)];
		if (memoObject !== undefined) {
			console.log("RETURNING memoized cons!!!!!!!!");
			return memoObject;
		}
	}
	
	if (!props) props = {};
	
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

addProp("K.object", "upRight", "Set K.cons");
addProp("K.object", "upLeft", "Set K.cons");
addProp("K.cons", "left", "K.object");
addProp("K.cons", "right", "K.object");
addProp("K.cons", "truth", "Unit Bool"); // this only applies if the relation is "in (the context of)"

// ==================================================================
// UI
// ==================================================================


// ==================================================================
// External Representations
// ==================================================================

makeClass("X.video", "K.object");
addProp("X.video", "url", "String");
addProp("X.video", "width", "Number");
addProp("X.video", "height", "Number");
addProp("X.video", "duration", "Number");


makeClass("X.text", "K.object");
addProp("X.text", "string", "String");