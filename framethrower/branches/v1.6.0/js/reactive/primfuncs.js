// ============================================================================
// Utility
// ============================================================================

// for keeping track of set correspondences
function makeCrossReference() {
	var cr = {};
	
	var inputs = makeObjectHash();
	var outputs = makeObjectHash();
	
	cr.hasInput = function (input) {
		return inputs.get(input);
	};
	
	cr.addLink = function (input, output, callback) {
		if (!outputs.get(output)) {
			callback(output);
		}
		inputs.getOrMake(input, makeObjectHash).set(output, output);
		outputs.getOrMake(output, makeObjectHash).set(input, input);
	};
	
	function checkDead(output, callback) {
		var ins = outputs.get(output);
		if (ins.isEmpty()) {
			outputs.remove(output);
			callback(output);
		}
	}
	
	cr.removeLink = function (input, output, callback) {
		var outs = inputs.get(input);
		if (outs) {
			outs.remove(output);
			var ins = outputs.get(output);
			ins.remove(input);
			checkDead(output, callback);
		}
	};
	
	cr.removeInput = function (input, callback) {
		var outs = inputs.get(input);
		if (outs) {
			outs.forEach(function (output) {
				var ins = outputs.get(output);
				ins.remove(input);
				checkDead(output, callback);
			});
		}
		inputs.remove(input);
	};
	
	return cr;
}



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
					var innerEc;
					var processor = function (messages) {
						var message = messages[messages.length-1];

						// could typeCheck message here	
						if(message.value) {
							var resultCap = apply(f,message.value);
							
							var innerProcessor = function (messages) {
								var message = messages[messages.length-1];
								outputCap.send(message);
							};
							if (innerEc) {
								innerEc.deactivate();
							}
							innerEc = makeEndCap(resultCap, innerProcessor);				
						} else {
							if (innerEc) {
								innerEc.deactivate();
							}
							outputCap.send(message);
						}
					};
				
					var ec = makeEndCap(sc, processor);

					return outputCap;
				};
			};
		}
	},
	bindSet : {
		typeSig : parse("(a -> Set b) -> Set a -> Set b"),
		make : function (a, b) {
			return function (f) {
				return function (sc) {
					var outputCap = makeStartCap(parse("Set " + unparse(b)));
					
					var outputCR = makeCrossReference();
					var ECs = makeOhash();
					
					
					var processor = function (messages) {
						forEach(messages, function (message) {
							if (message.action == messageEnum.set) {
								var input = message.value;
								var resultCap = apply(f,message.value);

								var innerProcessor = function (messages) {
									forEach(messages, function (message) {
										if (message.action == messageEnum.set) {
											var callback = function (value) {
												outputCap.send(makeMessage.set(value));
											};
											outputCR.addLink(input, message.value, callback);
										} else if (message.action == messageEnum.remove) {
											var callback = function (value) {
												outputCap.send(makeMessage.remove(value));
											};
											outputCR.removeLink(input, message.value, callback);
										}
									});
								};

								var innerEc = makeEndCap(resultCap, innerProcessor);
								ECs.set(input, innerEC);
							} else if (message.action == messageEnum.remove) {
								var callback = function (value) {
									outputCap.send(makeMessage.remove(value));
								};
								outputCR.removeInput(message.value, callback);
								//need to clean up the innerEC associated with this input
								var doneEC = ECs.get(message.value);
								doneEC.deactivate();
								ECs.remove(message.value);
							}
						});
					};
				
					var ec = makeEndCap(sc, processor);

					return outputCap;
				};
			};
		}
	}
};