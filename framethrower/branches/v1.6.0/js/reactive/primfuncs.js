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

				

				var outputCap = makeStartCap(parse("Set " + unparse(a)), null, getState);
				
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
				
				return outputCap;
			};
		}
	},
	bindUnit : {
		typeSig : parse("(a -> Unit b) -> Unit a -> Unit b"),
		make : function (a, b) {
			return function (f) {
				return function (sc) {

					var outputCap = makeStartCap(parse("Unit " + unparse(b)));
				
					var processor = function (messages) {
						var message = messages[messages.length-1];

						// could typeCheck message here	
						if(message.value) {
							var resultCap = apply(f,message.value);
							
							var innerProcessor = function (messages) {
								var message = messages[messages.length-1];
								outputCap.send(message);
							};
							
							var innerEc = makeEndCap(resultCap, innerProcessor);				
						} else {
							outputCap.send(message);
						}
					};
				
					var ec = makeEndCap(sc, processor);

					return outputCap;
				};
			};
		}
	}	
};