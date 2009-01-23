/*

An Object looks like:
{
	kind: "object",
	type: Type,
	origType: Type,
	prop: {propName:property}
}

*/


var classesToMake = {
	
	// ====================================================
	// Core
	// ====================================================
	
	"Object": {
		prop: {
			"upLeft": "Set Cons",
			"upRight": "Set Cons"
		}
	},
	"Cons": {
		inherit: "Object",
		prop: {
			"left": "Object",
			"right": "Object",
			"truth": "Unit Null"
		},
		memoize: ["left", "right"]
	},
	
	// ====================================================
	// External Representations
	// ====================================================
	
	"X.video": {
		inherit: "Object",
		prop: {
			"url": "String",
			"width": "Number",
			"height": "Number",
			"duration": "Number"
		}
	},
	"X.text": {
		inherit: "Object",
		prop: {
			"string": "String"
		},
		memoize: ["string"]
	},
	"X.xml": {
		inherit: "Object",
		prop: {
			"xml": "XML"
		}
	},
	
	// ====================================================
	// UI
	// ====================================================
	
	"UI.prefs": {
		prop: {
			"typeDisplay": "Map Object String"
		}
	}
};


var objects = (function (classesToMake) {
	var classes = {};
	
	// ====================================================
	// Making classes
	// ====================================================
	
	function makeClass(name, inherit, memoize) {
		var cast = makeCast(name);
		classes[name] = {
			name: name,
			prop: {},
			inherit: inherit && classes[inherit],
			memoize: memoize,
			memoTable: {},
			makeMemoEntry: function () {
				return {
					broadcaster: makeCC(parseType("Unit "+name))
				};
			},
			castUp: cast,
			castDown: makeCastDown(cast, name)
		};

		// add 2 casting functions to env for each inherited Class
		makeCasts(classes[name].inherit, name);
	}

	function makeCasts(superClass, targetClassName) {
		if (superClass !== undefined) {
			var superClassName = superClass.name;
			// Casting Up, example castUp: 'Object~Cons'
			var castUpFuncName = targetClassName + "~" + superClassName;
			var castUpType = targetClassName + " -> " + superClassName;
			var castUpFunc = superClass.castUp;
			addFun(castUpFuncName, castUpType, castUpFunc);
			// Casting Down, example castDown: 'Cons~Object'
			var castDownFuncName = superClassName + "~" + targetClassName;
			var castDownType = superClassName + " -> Unit " + targetClassName;
			var castDownFunc = classes[targetClassName].castDown;
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
			
			if (inherits(classes[obj.origType.value], classes[targetClassName])) {
				outputCell.addLine(cast(obj));
			}
			return outputCell;
		};
	}
	
	// test inheritance
	function inherits(subClass, superClass) {
		if (subClass === superClass) {
			return true;
		} else if (subClass.inherit !== undefined) {
			return inherits(subClass.inherit, superClass);
		} else {
			return false;
		}
	}

	function addProp(name, propName, typeString) {
		classes[name].prop[propName] = parseType(typeString);
		
		// get function, example: 'Object:upLeft'
		var getFuncName = name + ":" + propName;
		
		var funcType;
		if (isReactive(classes[name].prop[propName])) {
			funcType = name + " -> " + "("+typeString+")";
		} else {
			funcType = name + " -> " + "Future " + "("+typeString+")";
		}
		var getFunc = function (obj) {
			return obj.prop[propName];
		};
		addFun(getFuncName, funcType, getFunc);
	}
	
	
	// ====================================================
	// Memoizing
	// ====================================================
	
	function makeMemoString(memoValues) {
		var strings = map(memoValues, function (value) {
			return JSON.stringify(stringify(value));
		});
		return strings.join(",");
	}
	
	function addMemoLookup(className, classDef) {
		if (classDef.memoize) {
			var c = classes[className];
			var memoTable = c.memoTable;
			
			var funcName = className + "::" + "lookup";
			var typeStrings = map(classDef.memoize, function (propName) {
				return classDef.prop[propName];
			});
			var funcType = "(" + typeStrings.join(") -> (") + ")" + " -> " + "Unit " + className;
			var func = function () {
				var memoString = makeMemoString(arguments);
				
				if (!memoTable[memoString]) {
					memoTable[memoString] = c.makeMemoEntry();
				}
				return memoTable[memoString].broadcaster;
			};
			addFun(funcName, funcType, func, c.memoize.length);
		}
	}
	
		
	// ====================================================
	// Make the classes based on class definitions
	// ====================================================
	
	// make the classes
	forEach(classesToMake, function (classDef, name) {
		makeClass(name, classDef.inherit, classDef.memoize);
	});
	
	// add the properties
	forEach(classesToMake, function (classDef, name) {
		forEach(classDef.prop, function (typeString, propName) {
			addProp(name, propName, typeString);
		});
		addMemoLookup(name, classDef);
	});
	
	
	// ====================================================
	// Making objects
	// ====================================================
	
	function addPropsToObject(props, obj, objClass) {
		forEach(objClass.prop, function (propType, propName) {
			if (isReactive(propType)) {
				// fill in with an empty controlled cell
				obj.prop[propName] = makeCC(propType);
			} else {
				var instanceValue = props[propName];
				if (instanceValue === undefined) {
					debug.error("Error making object of type `"+objClass.name+"`. Property `"+propName+"` needs to be defined.");
				}
				var instanceType = getType(instanceValue);
				
				var propValue;
				if (compareTypes(instanceType, propType)) {
					propValue = instanceValue;
				} else if (instanceType.kind === "typeName" && propType.kind === "typeName" && inherits(classes[instanceType.value], classes[propType.value])) {
					propValue = classes[propType.value].castUp(props[propName]);
				} else {
					debug.error("Property type mismatch: `"+ unparseType(getType(props[propName])) +"` and `"+unparseType(propType)+"`");
				}
				
				obj.prop[propName] = makeFuture(propValue);
			}
		});
		if (objClass.inherit) {
			addPropsToObject(props, obj, objClass.inherit);				
		}
	}

	function makeObject(className, props) {
		if (!props) props = {};
		
		var c = classes[className];
		
		var memoString;
		if (c.memoize) {
			var memoValues = map(c.memoize, function (propName) {
				if (props[propName] === undefined) {
					debug.error("Property `"+propName+"` needs to be specified for memoizing when creating an object of type `"+className+"`");
				}
				return props[propName];
			});
			memoString = makeMemoString(memoValues);
			
			if (c.memoTable[memoString] && c.memoTable[memoString].object) {
				return c.memoTable[memoString].object;
			}
		}
		var type = {kind: "typeName", value: className};

		var o = {
			kind: "object",
			origType: type,
			type: type,
			prop: {}
		};

		addPropsToObject(props, o, classes[className]);

		if (c.memoize) {
			if (!c.memoTable[memoString]) {
				c.memoTable[memoString] = c.makeMemoEntry();
			}
			
			var entry = c.memoTable[memoString];
			if (entry) {
				entry.object = o;
				entry.broadcaster.control.add(o);
			}
		}

		return o;
	}
	
	return {
		make: makeObject,
		classDefs: classesToMake,
		debug: classes,
		inherits: function (subClassName, superClassName) {
			return (classes[subClassName] && classes[superClassName] && inherits(classes[subClassName], classes[superClassName]));
		}
	};
})(classesToMake);