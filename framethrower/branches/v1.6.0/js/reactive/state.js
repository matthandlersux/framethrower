var defaultStates = {
	unit : function (a) {
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
	},
	set : function (a) {
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
	},
	staticType : function (a) {
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
	}
};

function makeState(type) {
	if (type.cons == "apply") {
		//type is reactive
		return defaultStates[type.left.toLowerCase()](type.right);
	} else {
		//type is static
		return defaultStates.staticType(type);
	}
}