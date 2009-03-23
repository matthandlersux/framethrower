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
	
	// "Core.relationType": {
	// 	inherit: "Object",
	// 	prop: {
	// 		"input": "Map Number Object",
	// 		"output": "Object"
	// 	}
	// },
	
	// ====================================================
	// External Representations
	// ====================================================
	
	"X.video": {
		inherit: "Object",
		prop: {
			"url": "String",
			"width": "Number",
			"height": "Number",
			//"frameCount": "Number",
			"frameRate": "Number",
			"duration": "Number"
		}
	},
	"X.picture": {
		inherit: "Object",
		prop: {
			"url": "String",
			"width": "Number",
			"height": "Number"
		}
	},
	"X.picture.crop": {
		inherit: "Object",
		prop: {
			"x": "Number",
			"y": "Number",
			"width": "Number",
			"height": "Number"
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
	
	"X.time.range": { // this should be renamed X.video.time.range
		inherit: "Object",
		prop: {
			"start": "Number",
			"duration": "Number"
		}
	},
	
	
	"X.date": {
		inherit: "Object",
		prop: {
			"day": "Number" // for now Jan 1, 2000 is 0
		},
		memoize: ["day"]
	},
	
	"X.prefs": {
		inherit: "Object",
		prop: {
			"typeColors": "Map Object String"
		}
	},
	
	
	
	// ====================================================
	// UI
	// ====================================================
	
	"UI.ui": {
		prop: {
			"screenWidth": "Unit Number",
			"screenHeight": "Unit Number",
			"mouseX": "Unit Number",
			"mouseY": "Unit Number"
		}
	},
	
	"UI.main": {
		prop: {
			"pane": "UI.pane",
			"popup": "Map String UI.popup",
			"dragging": "Unit UI.dragging"
		}
	},
	
	"UI.popup": {
		prop: {
			"display": "XML",
			"content": "Unit JS"
		}
	},
	
	"UI.dragging": { // this will have more stuff eventually...
		prop: {
			"object": "Object"
		}
	},
	
	"UI.pane": {
		prop: {
			"width": "Unit Number",
			"height": "Unit Number"
		}
	},
	"UI.pane.set": {
		inherit: "UI.pane",
		prop: {
			"panes": "Map String UI.pane",
			"orientation": "Unit String"
		}
	},
	"UI.pane.timeline": {
		inherit: "UI.pane",
		prop: {
			"focus": "Object",
			"zoomWidth": "Unit Number",
			"previewFrame": "Unit Number",
			"selectedTime1": "Unit Number",
			"selectedTime2": "Unit Number",
			"selecting": "Unit Null"
		}
	},
	"UI.pane.realTimeline": {
		inherit: "UI.pane",
		prop: {
			"focus": "Object",
			"startDate": "Unit Number",
			"endDate": "Unit Number",
			"zoomWidth": "Unit Number"
		}
	},
	
	
	"UI.pane.pane": {
		inherit: "UI.pane",
		prop: {
			"tab": "Unit String", // objectsIn, addingObj, infonsIn, about
			"focus": "Unit Object", // this should just be Object, TODO
			"propertiesState": "UI.propertiesState",
			"aboutNewInfons": "Set UI.consIP",
			"infonsInNewInfons": "Set UI.consIP",
			"addingObject": "Unit Object",
			"addingObjectPropertiesState": "UI.propertiesState"
		},
		makeNew: ["propertiesState", "addingObjectPropertiesState"]
	},
	
	"UI.propertiesState": {
		prop: {
			"editName": "Unit Null",
			"typeExplorer": "Unit UI.outlineNode"
		}
	},
	
	
	
	"UI.consIP": {
		prop: {
			"object": "Unit Object",
			"left": "Unit UI.consIP",
			"right": "Unit UI.consIP"
		}
	},
	
	
	"UI.outlineNode": {
		prop: {
			"focus": "Object", // the use of Outline here should be replaced by a, when we have polymorphic classes (ie: UI.outlineNode a)
			"children": "Map Object UI.outlineNode",
			"expanded": "Unit Null"
		}
	},
	
	"UI.relationCreator.word": {
		prop: {
			"string": "Unit String",
			"type": "Unit Object"
		}
	},
	
	"UI.relationCreator": {
		prop: {
			"typeExplorer": "UI.outlineNode",
			"words": "Map String UI.relationCreator.word"
		}
	},
	
	
	
	"UI.prefs": {
		prop: {
			"typeDisplay": "Map Object String",
			"timelineLayers": "Map String Object"
		}
	}
};


var objects = (function (classesToMake) {
	var classes = {};
	
	// ====================================================
	// Making classes
	// ====================================================
	
	function makeClass(name, inherit, memoize, makeNew) {
		// TODO: make this just take a name and classDef instead of passing in inherit, memoize, makeNew, etc.
		var cast = makeCast(name);
		classes[name] = {
			name: name,
			prop: {},
			inherit: inherit && classes[inherit],
			makeNew: makeNew,
			memoize: memoize,
			memoTable: {},
			makeMemoEntry: function () {
				var broadcaster = makeCC(parseType("Unit "+name));
				broadcaster.setDone();
				return {
					broadcaster: broadcaster
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
			if (obj.remote === 1) {
				debug.error("Trying to cast a remote object, if you see this then we need to fix this...");
			}
			
			if (!obj.as[targetClassName]) {
				obj.as[targetClassName] = {
					kind: obj.kind,
					origType: obj.origType,
					type: {kind: "typeName", value: targetClassName},
					prop: obj.prop,
					as: obj.as
				};
			}
			return obj.as[targetClassName];
		};
	}

	function makeCastDown(cast, targetClassName) {
		return function (obj) {
			var outputCell = makeCell();
			
			if (inherits(classes[obj.origType.value], classes[targetClassName])) {
				outputCell.addLine(cast(obj));
			}
			outputCell.setDone();
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
		makeClass(name, classDef.inherit, classDef.memoize, classDef.makeNew);
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
	
	function actOnProp(propName, object, action, key, value) {
		var objClass = classes[object.type.value];
		var castedValue;
		
		if (action === 'add') {
			castedValue = castIfNeeded(propName, object, objClass, key, value);
			object.prop[propName].control[action](castedValue.key, castedValue.val);
		} else {
			object.prop[propName].control[action](key, value);
		}
	}

	function compareAndCast(instanceValue, propType) {
		var instanceType = getType(instanceValue);
		if (compareTypes(instanceType, propType)) {
			return instanceValue;
		} else if (instanceType.kind === "typeName" && propType.kind === "typeName" && inherits(classes[instanceType.value], classes[propType.value])) {
			return classes[propType.value].castUp(instanceValue);
		} else {
			debug.error("Property type mismatch: `"+ unparseType(instanceType) +"` and `"+unparseType(propType)+"`");
		}
	}

	function castIfNeeded(propName, obj, objClass, instanceKey, instanceValue) {		
		var reactiveType = objClass.prop[propName];
		if (reactiveType !== undefined) {
			var constructor = getTypeConstructor(reactiveType);
			if (constructor === "Map"){
				var propType1 = reactiveType.left.right;
				var val1 = compareAndCast(instanceKey, propType1);
				var propType2 = reactiveType.right;
				var val2 = compareAndCast(instanceValue, propType2);
				return {key:val1, val:val2};
			} else {
				var propType = reactiveType.right;
				return {key:compareAndCast(instanceKey, propType)};
			}
		} else {
			if (objClass.inherit) {
				return castIfNeeded(propName, obj, objClass.inherit, instanceKey, instanceValue);
			} else {
				debug.error("Property not found: `"+ propName);
			}
		}
	}

	
	function addPropsToObject(props, obj, objClass) {
		forEach(objClass.prop, function (propType, propName) {
			var instanceValue = props[propName];
			if (isReactive(propType) && instanceValue === undefined) {
				// fill in with an empty controlled cell
				obj.prop[propName] = makeCC(propType);
				obj.prop[propName].setDone();
			} else {
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
				
				var instanceType = getType(props[propName]);
				var propType = c.prop[propName];
				
				if (!compareTypes(instanceType, propType) && instanceType.kind === "typeName" && propType.kind === "typeName" && inherits(classes[instanceType.value], classes[propType.value])) {
					return classes[propType.value].castUp(props[propName]);
				}
				return props[propName];
			});
			memoString = makeMemoString(memoValues);
			
			if (c.memoTable[memoString] && c.memoTable[memoString].object) {
				return c.memoTable[memoString].object;
			}
		}
		
		if (c.makeNew) {
			forEach(c.makeNew, function (propName) {
				if (props[propName] === undefined) {
					props[propName] = makeObject(c.prop[propName].value, {});					
				}
			});
		}
		
		var type = {kind: "typeName", value: className};
		
		var o = {
			kind: "object",
			origType: type,
			type: type,
			prop: {},
			as: {} // TODO: find a new mechanism for as and origType
		};
		o.as[className] = o;

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
	
	
	// TODO:
	//  Decide if we even want this.
	//	Have Andrew audit this, add to server. Add any necessary remove things?
	
	// var propertiesType = parseType("Properties");
	// var gsp = addFun("getStaticProperties", "a -> Future Properties", function (o) {
	// 	var outputCell = makeCell();
	// 	
	// 	function output(value) {
	// 		outputCell.addLine({
	// 			kind: "properties",
	// 			type: propertiesType,
	// 			value: value
	// 		});
	// 	}
	// 	
	// 	if (o.kind === "object") {
	// 		var className = o.origType.value;
	// 		// cast to lowest level
	// 		o = o.as[className];
	// 
	// 		var ret = {
	// 			object: o,
	// 			type: className,
	// 			prop: {}
	// 		};
	// 		var prop = classes[className].prop;
	// 		
	// 		var propCount = 1;
	// 		function checkDone() {
	// 			if (propCount === 0) output(ret);
	// 		}
	// 		
	// 		forEach(prop, function (propType, propName) {
	// 			if (!isReactive(propType)) {
	// 				propCount++;
	// 				var propValue = o.prop[propName].getState()[0];
	// 				evaluateAndInject(makeApply(gsp, propValue), function (childProps) {
	// 					ret.prop[propName] = childProps;
	// 					propCount--;
	// 					checkDone();
	// 				});
	// 			}
	// 		});
	// 		propCount--;
	// 		checkDone();
	// 	} else {
	// 		output(o);
	// 	}
	// 	
	// 	return outputCell;
	// });
	
	
	
	
	return {
		make: makeObject,
		actOnProp: actOnProp,
		classDefs: classesToMake,
		debug: classes,
		inherits: function (subClassName, superClassName) {
			// returns true if subClass (eg Cons) inherits from superClass (eg Object)
			return (classes[subClassName] && classes[superClassName] && inherits(classes[subClassName], classes[superClassName]));
		},
		cast: function (obj, targetClassName) {
			if (objects.inherits(getType(obj).value, targetClassName)) {
				return makeCast(targetClassName)(obj);				
			} else {
				debug.error("Cannot convert object of type `" + getType(obj).value + "` to `" + targetClassName + "`.");
			}
		},
		isClass: function (className) {
			return !!classes[className];
		}
	};
})(classesToMake);