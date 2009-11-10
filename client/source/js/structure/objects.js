//TODO: make the classDef representation use parsed types instead of type Strings

var objects = (function () {

	function isRemoteClass(className) {
		if (className === "TestClass") {
			return true;
		}
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
		
		var funcName = className + ":" + "lookup";
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
		var remoteLevel = isRemoteClass(className) ? remote.shared : remote.localOnly;
		addFun(funcName, funcType, func, classDef.memoize.length, remoteLevel);
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
		if (remoteEquals(object.remote, remote.serverOnly)) {
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
		var remoteLevel = isRemoteClass(className) ? remote.shared : remote.localOnly;
		// iterate up the inherit property
		var ancestor = className;
		while (ancestor = classDefs[ancestor].inherit) {
			// cast up (subject~ancestor)
			var castUpFuncName = className + "~" + ancestor;
			var castUpType = className + " -> " + ancestor;
			var castUpFunc = makeCastFunc(ancestor);
			addFun(castUpFuncName, castUpType, castUpFunc, undefined, remoteLevel);
			
			// cast down (ancestor~subject)
			var castDownFuncName = ancestor + "~" + className;
			var castDownType = ancestor + " -> Unit " + className;
			var castDownFunc = makeCastFuncCell(className);
			addFun(castDownFuncName, castDownType, castDownFunc, undefined, remoteLevel);
		}
	}
	
	// ====================================================
	// Properties
	// ====================================================
	
	function accessProperty(object, propName) {
		// This function assumes that all properties have different names, going up the inheritance hierarchy.
		// also works for objects without 'as' (objects sent from server for now)
		var ret;
		if (object.as) {
			forEach(object.as, function (incarnation) {
				if (incarnation.prop[propName] !== undefined) {
					//note: cannot return directly from here because we are wrapped in a forEach
					ret = incarnation.prop[propName];
				}
			});
		} else {
			if (object.prop[propName] !== undefined) {
				ret = object.prop[propName];
			}
		}
		return ret;
	}
	
	function addPropertyAccessorFuns(className) {
		var remoteLevel = isRemoteClass(className) ? remote.shared : remote.localOnly;
		// iterate up the inherit property
		var ancestor = className;
		while (ancestor) {
			var classDef = classDefs[ancestor];
			forEach(classDef.prop, function (propTypeString, propName) {
				var propType = parseType(propTypeString);
				var funcName = className + ":" + propName;
				
				var type = className + " -> " + "("+propTypeString+")";
				
				function func(object) {
					return accessProperty(object, propName);
				}
				
				addFun(funcName, type, func, undefined, remoteLevel);
			});
			
			ancestor = classDefs[ancestor].inherit;
		}
	}
	
	// ====================================================
	// Property Types
	// ====================================================

	//
	// getPropTypes :: String -> {String: Type}
	//
	function getPropTypes(className) {
		var props = classDefs[className].prop;
		return map(props, function(typeString) {
			return parseType(typeString);
		});
	}
	
	// ====================================================
	// Initialize
	// ====================================================
	
	var classTypes = {};
	var classDefs = {};
	
	function addClass(className, classDef) {
		classDefs[className] = classDef;
		// make memo table and lookup fun
		if (classDef.memoize) {
			memoTables[className] = {};
			addMemoLookupFun(className);
		}
		addCastingFuns(className);
		addPropertyAccessorFuns(className);
		classTypes[className] = makeTypeName(className);
	}
		
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
				
				if (isReactive(propType) && instanceValue === undefined) {
					// fill in with an empty controlled cell
					obj.prop[propName] = makeCC(propType);
					obj.prop[propName].setDone();
				} else {
					instanceValue = castObject(instanceValue, propTypeString);
					
					// check type
					if (GLOBAL.typeCheck && !compareTypes(getType(instanceValue), propType)) {
						debug.error("Property type mismatch. Expected `"+propTypeString+"` but got `"+unparseType(getType(instanceValue))+"`");
					}
					
					obj.prop[propName] = instanceValue;
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
		addClass: addClass,
		getPropTypes: getPropTypes,
		inherits: inherits,
		isClass: function (className) {
			return !!classDefs[className];
		}
	};
})();
