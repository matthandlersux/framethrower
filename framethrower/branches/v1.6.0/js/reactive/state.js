var defaultStates = function () {
	var unit = function () {
		var cache = [];
		return {
			update : function (inMessages) {
				//for units, we only need to store the last message being sent
				cache = [inMessages[inMessages.length-1]];
				//potentially do type checking here with a debug flag
			},
			get : function () {
				return cache;
			}
		};
	};
	var set = function () {
		var cache = makeOhash();
		return {
			update : function (inMessages) {
				forEach(inMessages, function (inMessage) {
					if (inMessage.action == messageEnum.remove) {
						cache.remove(inMessage.value);
					} else {
						cache.set(inMessage.value, inMessage);
					}
				});
			},
			get : function () {
				return cache.toArray();
			}
		};
	};
	var assoc = function () {
		var cache = makeOhash();
		return {
			update : function (inMessages) {
				forEach(inMessages, function (inMessage) {
					if (inMessage.action == messageEnum.remove) {
						cache.remove(inMessage.value);
					} else {
						cache.set(inMessage.key, inMessage);
					}
				});
			},
			get : function () {
				return cache.toArray();
			}
		};
	};
	var staticType = function () {
		var cache = [];
		return {
			update : function (inMessages) {
				//for static, we only expect one message ever
				cache = [inMessages[0]];
				//potentially do type checking here with a debug flag
			},
			get : function () {
				return cache;
			}
		};
	};
	
	return {
		unit : unit,
		set : set,
		assoc : assoc,
		staticType : staticType
	};
}();

function makeState(type) {
	if (type.cons == "static") {
		//type is static
		return defaultStates.staticType(type);
	} else {
		//type is reactive
		return defaultStates[type.toLowerCase()]();
	}
}