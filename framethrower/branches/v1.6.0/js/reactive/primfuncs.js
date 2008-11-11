var primFuncs = {
	returnUnit : {
		typeSig : parse("a -> Unit a"),
		make : function (a) {
			return function (val) {
				var sc = makeStartCap(a);
				sc.send([makeMessage.set(val)]);
				return sc;
			};
		}
	},
	returnUnitSet : {
		typeSig : parse("Unit a -> Set a"),
		make : function (a) {
			return function (sc) {
				var cache;

				var getState = function () {
					return makeMessage.set(cache);
				};

				var outputCap = makeStartCap(parse("Set a"), null, getState);
				
				var processor = function (messages) {
					var message = messages[messages.length-1];
					if(message.action == messageEnum.set) {
						if(cache) {
							outputCap.send(makeMessage.remove(message.value));
						}
						cache = message.value;
						if(message.value) {
							outputCap.send([message]);
						}
					}
				};
				
				var ec = makeEndCap(sc, processor);
			};
		}
	}
};