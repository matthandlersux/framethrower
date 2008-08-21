var interfaceInstantiators = {
	unit: function (a) {
		var cache;
		return {
			actions: {
				set: function (o) {
					typeCheck(a, o);
					cache = o;
				}
			},
			addInform: function (pin) {
				pin.set(cache);
			},
			getState: function () {
				return cache;
			}
		};
	},
	set: function (a) {
		var cache = makeObjectHash();
		return {
			actions: {
				add: function (o) {
					typeCheck(a, o);
					cache.set(o, o);
				},
				remove: function (o) {
					typeCheck(a, o);
					cache.remove(o);
				}
			},
			addInform: function (pin) {
				cache.forEach(function (o) {
					pin.add(o);
				});
			},
			getState: function () {
				return cache.toArray();
			}
		};
	},
	list: function (a) {
		var cache = [];
		return {
			actions: {
				insert: function (o, index) {
					typeCheck(a, o);
					cache.splice(index, 0, o);
				},
				update: function (o, index) {
					typeCheck(a, o);
					cache[index] = o;
				},
				remove: function (index) {
					cache.splice(index, 1);
				}
			},
			addInform: function (pin) {
				cache.forEach(function (o, index) {
					pin.insert(o, index);
				});					
			},
			getState: function () {
				return cache;
			}
		};
	}
};


/*
interfaces are functions that take type(s) as arguments and return a new type
for example: interfaces.set(kernel.individual) is a type
interface types are special in that they have an instantiate method which is used by outputPins
*/

var interfaces = {};
forEach(interfaceInstantiators, function (interfaceInstantiate, name) {
	interfaces[name] = memoize(function () {
		var args = arguments;
		
		// makes the name = "interfaces.NAME(ARG1, ARG2, ...)"
		var intf = makeType("interface." + name + "(" + map(args, function (a) {return a.getName();}).join(", ") + ")");
		
		intf.instantiate = function () {
			return interfaceInstantiate.apply(null, args);
		};
		
		// these are just used for matching against
		intf.getConstructor = getter(interfaceInstantiate);
		intf.getArguments = getter(args);
		
		// checks that interfaceInstantiate (ie: the same type of interface) matches, and then matches the arguments
		intf.match = function (instanceType) {
			if (instanceType.getConstructor && instanceType.getConstructor() === intf.getConstructor()) {
				var instanceArgs = instanceType.getArguments();
				var myArgs = intf.getArguments();
				
				var ret = {};
				
				forEach(myArgs, function (arg, i) {
					var o = arg.match(instanceArgs[i]);
					ret = merge(ret, o);
				});
				
				return ret;

			} else {
				errorTypeMismatch();
			}
		};
		
		// calls on the argument types
		intf.assign = function (o) {
			var newArgs = [];
			forEach(args, function (arg, i) {
				newArgs[i] = arg.assign(o);
			});
			return interfaces[name].apply(null, newArgs);
		};
		
		return intf;
	});
});