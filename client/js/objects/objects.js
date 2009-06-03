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
	// New
	// ====================================================
	
	"Situation": {
		prop: {
			"container": "Unit Situation",
			"contains": "Set Situation",
			"propName": "Unit String", // these prop*s will be refactored!
			"propTime": "Unit Number",
			"propTimeline": "Unit Timeline",
			"pipesIn": "Set Pipe",
			"pipesOut": "Set Pipe"
		}
	},
	

	"Pipe": {
		prop: {
			"type": "Situation",
			"instance": "Situation",
			"container": "Map Ord Pipe",
			"contains": "Set Pipe",
			"truth": "Unit Number"
		}
	},
	
	
	"TimeSelection": {
		prop: {
			"start": "Unit Number",
			"duration": "Unit Number"
		}
	},
	
	"Timeline": {
		prop: {
			"duration": "Number",
			"video": "Unit X.video"
		}
	},
	
	
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
			"duration": "Number",
			"cuts": "Unit JSON"
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
	"X.dateRange": {
		inherit: "Object",
		prop: {
			"startDay": "Number",
			"endDay": "Number"
		},
		memoize: ["startDay", "endDay"]
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
			"mouseY": "Unit Number",
			"mouseDown": "Unit Null"
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
			"zoomWidth": "Unit Number",
			"selectedTime1": "Unit Number",
			"selectedTime2": "Unit Number",
			"selecting": "Unit Null"
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
	},
	
	// ====================================================
	// SV (Situation View)
	// ====================================================
	"Position": {
		prop: {
			"x": "Unit Number",
			"y": "Unit Number"
		}
	},	

	"ShapePosition": {
		prop: {
			"scale": "Unit Number",
			"position": "Position"
		}
	},

	"ChildProp": {
		prop: {
			"hidden": "Unit Null",
			"position": "Position",
			"dragPosition": "Position",
			"scale": "Unit Number"
		}
	}
	
};





var objects = (function (classDefs) {

	function isRemoteClass(className) {
		return inherits(className, "Object");
	}
	
	// ====================================================
	// Memoizing
	// ====================================================
	
	var memoTables = {};
	
	function makeMemoString(memoValues) {
		var strings = map(memoValues, function (value) {
			return JSON.stringify(stringify(value));
		});
		return strings.join(",");
	}
	
	function makeMemoBroadcaster(className) {
		var broadcaster = makeCC(parseType("Unit " + className));
		broadcaster.setDone();
		return broadcaster;
	}
	
	function addMemoLookupFun(className) {
		var memoTable = memoTables[className];
		var classDef = classDefs[className];
		
		var funcName = className + "::" + "lookup";
		var typeStrings = map(classDef.memoize, function (propName) {
			return classDef.prop[propName];
		});
		var funcType = "(" + typeStrings.join(") -> (") + ")" + " -> " + "Unit " + className;
		var func = function () {
			var memoString = makeMemoString(arguments);
			
			if (!memoTable[memoString]) {
				memoTable[memoString] = makeMemoBroadcaster(className);
			}
			return memoTable[memoString];
		};
		var remote = isRemoteClass(className) ? 0 : 2;
		addFun(funcName, funcType, func, classDef.memoize.length, remote);
	}
	
	function getMemoedObject(className, memoString) {
		if (memoTables[className][memoString]) return memoTables[className][memoString].getState()[0];
	}
	function setMemoedObject(className, memoString, object) {
		if (!memoTables[className][memoString]) {
			memoTables[className][memoString] = makeMemoBroadcaster(className);
		}
		memoTables[className][memoString].control.add(object);
	}

	// ====================================================
	// Casting and Inheritance
	// ====================================================
	
	// test inheritance
	function inherits(subClass, superClass) {
		if (subClass === superClass) {
			return true;
		} else if (classDefs[subClass] && classDefs[subClass].inherit !== undefined) {
			return inherits(classDefs[subClass].inherit, superClass);
		} else {
			return false;
		}
	}
	
	function castObject(object, castToName) {
		if (object === undefined || object.kind !== "object") return object;
		if (object.remote === 1) {
			debug.error("Trying to cast a remote object, if you see this then we need to fix this...");
		}
		if (!object.as[castToName]) {
			debug.error("Cannot cast object to class `"+castToName+"`", object);
		}
		return object.as[castToName];
	}
	function makeCastFunc(castToName) {
		return function (object) {
			return castObject(object, castToName);
		};
	}
	
	function makeCastFuncCell(castToName) {
		return function (object) {
			var outputCell = makeCell();
			if (object.as[castToName]) {
				outputCell.addLine(object.as[castToName]);
			}
			outputCell.setDone();
			return outputCell;
		};
	}
	
	function addCastingFuns(className) {
		var remote = isRemoteClass(className) ? 0 : 2;
		// iterate up the inherit property
		var ancestor = className;
		while (ancestor = classDefs[ancestor].inherit) {
			// cast up (subject~ancestor)
			var castUpFuncName = className + "~" + ancestor;
			var castUpType = className + " -> " + ancestor;
			var castUpFunc = makeCastFunc(ancestor);
			addFun(castUpFuncName, castUpType, castUpFunc, undefined, remote);
			
			// cast down (ancestor~subject)
			var castDownFuncName = ancestor + "~" + className;
			var castDownType = ancestor + " -> Unit " + className;
			var castDownFunc = makeCastFuncCell(className);
			addFun(castDownFuncName, castDownType, castDownFunc, undefined, remote);
		}
	}
	
	// ====================================================
	// Properties
	// ====================================================
	
	function accessProperty(object, propName) {
		// This function assumes that all properties have different names, going up the inheritance hierarchy.
		var ret;
		forEach(object.as, function (incarnation) {
			if (incarnation.prop[propName]) {
				ret = incarnation.prop[propName];
			}
		});
		return ret;
	}
	
	function addPropertyAccessorFuns(className) {
		var remote = isRemoteClass(className) ? 0 : 2;
		// iterate up the inherit property
		var ancestor = className;
		while (ancestor) {
			var classDef = classDefs[ancestor];
			forEach(classDef.prop, function (propTypeString, propName) {
				var propType = parseType(propTypeString);
				var funcName = className + ":" + propName;
				
				var type;
				if (isReactive(propType)) {
					type = className + " -> " + "("+propTypeString+")";
				} else {
					type = className + " -> " + "Future " + "("+propTypeString+")";
				}
				
				function func(object) {
					return accessProperty(object, propName);
				}
				
				addFun(funcName, type, func, undefined, remote);
			});
			
			ancestor = classDefs[ancestor].inherit;
		}
	}
	
	// ====================================================
	// Initialize
	// ====================================================
	
	var classTypes = {};
	forEach(classDefs, function (classDef, className) {
		// make memo table and lookup fun
		if (classDef.memoize) {
			memoTables[className] = {};
			addMemoLookupFun(className);
		}
		addCastingFuns(className);
		addPropertyAccessorFuns(className);
		classTypes[className] = makeTypeName(className);
	});
	
	// ====================================================
	// Making objects (instances)
	// ====================================================
	
	function make(className, props) {
		if (!props) props = {};
		var classDef = classDefs[className];
		
		var memoString;
		if (classDef.memoize) {
			var memoValues = map(classDef.memoize, function (propName) {
				var instance = props[propName];
				
				if (instance === undefined) {
					debug.error("Property `"+propName+"` needs to be specified for memoizing when creating an object of type `"+className+"`");
				}
				
				instance = castObject(instance, classDef.prop[propName]);
				
				return instance;
			});
			memoString = makeMemoString(memoValues);
			
			// check if it already exists
			var memoedObject = getMemoedObject(className, memoString);
			if (memoedObject) return memoedObject;
		}
		
		
		// create objects, put each version (ie: each inherited class instance) in the as hash
		var as = {};
		
		// iterate up the inherit property
		var ancestor = className;
		while (ancestor) {
			var def = classDefs[ancestor];
			var type = classTypes[ancestor];
			
			var obj = makeObject(type);
			
			if (def.makeNew) {
				forEach(def.makeNew, function (propName) {
					if (props[propName] === undefined) {
						props[propName] = make(def.prop[propName]);
					}
				});
			}
			
			forEach(def.prop, function (propTypeString, propName) {
				var propType = parseType(propTypeString); // TODO: memoize this?
				var instanceValue = props[propName];
				if (isReactive(propType)) {
					if (instanceValue === undefined) {
						// fill in with an empty controlled cell
						obj.prop[propName] = makeCC(propType);
						obj.prop[propName].setDone();
					} else {
						// check type
						if (!compareTypes(getType(instanceValue), propType)) {
							debug.error("Property type mismatch. Expected `"+propTypeString+"` but got `"+unparseType(getType(instanceValue))+"`");
						}
						// TODO: I don't think the makeFuture is right here, but it's what is expected when passing around Unit JS's.
						//obj.prop[propName] = makeFuture(instanceValue);
						obj.prop[propName] = instanceValue;
					}
				} else {
					if (instanceValue === undefined) {
						debug.error("Error making object of type `"+className+"`. Property `"+propName+"` needs to be defined.");
					}
					
					instanceValue = castObject(instanceValue, propTypeString);
					
					// check type
					if (!compareTypes(getType(instanceValue), propType)) {
						debug.error("Property type mismatch. Expected `"+propTypeString+"` but got `"+unparseType(getType(instanceValue))+"`");
					}
					
					obj.prop[propName] = makeFuture(instanceValue);
				}
			});
			
			as[ancestor] = obj;
			
			ancestor = classDefs[ancestor].inherit;
		}
		
		// let them all know about each other
		forEach(as, function (obj) {
			obj.as = as;
		});
		
		var ret = as[className];
		
		// memoize
		if (classDef.memoize) {
			setMemoedObject(className, memoString, ret);
		}
		
		return ret;
	}
	
	return {
		make: make,
		actOnProp: function (propName, object, action, key, value) {
			var prop = accessProperty(object, propName);
			var expectedType = getType(prop);
			
			var constructor = getTypeConstructor(expectedType);
			if (constructor === "Map"){
				var keyType = expectedType.left.right;
				var valueType = expectedType.right;
				
				if (keyType.value) key = castObject(key, keyType.value);
				if (valueType.value) value = castObject(value, valueType.value);
			} else {
				var keyType = expectedType.right;
				if (keyType.value) key = castObject(key, keyType.value);
			}
			
			prop.control[action](key, value);
		},
		classDefs: classDefs,
		inherits: inherits,
		cast: castObject,
		isClass: function (className) {
			return !!classDefs[className];
		}
	};
})(classesToMake);
