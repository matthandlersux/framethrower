
var typeNames = {};

function scaffold(skeleton, topName) {
	var ret = {};
	function add(name, o, parent) {
		var fullName = topName + "." + name;
		var type = makeType(fullName);
		typeNames[fullName] = type;
		
		type.parent = parent;
		type.prop = {};
		
		type.match = function (instanceType) {
			var t = instanceType;
			while (t) {
				if (type === t) {
					return true;
				}
				t = t.parent;
			}
			return false;
		};
		
		type.getProp = function (propName) {
			var t = type;
			while (t) {
				if (t.prop[propName]) {
					return t.prop[propName];
				}
				if (t.auto && t.auto[propName]) {
					return t.auto[propName].type;
				}
				t = t.parent;
			}
			return undefined;
		};
		
		type.make = function (inst) {
			var instance = makeIded(type);
			
			instance.get = {};
			instance.control = {};
						
			function addProperties(t) {
				forEach(t.prop, function (propType, name) {
					if (propType.instantiate) {
						instance.control[name] = {};
						instance.get[name] = getter(makeSimpleStartCap(propType, instance.control[name]));
					} else {
						instance.get[name] = getter(inst[name]);
					}
				});
				
				if (t.auto) {
					forEach(t.auto, function (autoDerive, name) {
						instance.get[name] = getter(autoDerive.deriver(instance));
						/*var pin = instance.get[name]();
						// keep it alive
						var emptyFunc = function () {};
						var constructor = pin.getType().getConstructor();
						var emptyProc;
						if (constructor === interfaces.unit) {
							emptyProc = {set: emptyFunc};
						} else if (constructor === interfaces.set) {
							emptyProc = {add: emptyFunc, remove: emptyFunc};
						} else if (constructor === interfaces.list) {
							emptyProc = {insert: emptyFunc, update: emptyFunc, remove: emptyFunc};
						} else if (constructor === interfaces.assoc) {
							emptyProc = {set: emptyFunc, remove: emptyFunc};
						} else if (constructor === interfaces.tree) {
							emptyProc = {addRoot: emptyFunc, addChild: emptyFunc, remove: emptyFunc};
						}
						makeSimpleEndCap(makeAmbient(), emptyProc, pin);*/
					});
				}
			}
			
			var t = type;
			while (t) {
				addProperties(t);
				t = t.parent;
			}
			
			return instance;
		};
		ret[name] = type;
		
		forEach(o, function (child, childName) {
			add(childName, child, type);
		});
	}
	
	forEach(skeleton, function (child, childName) {
		add(childName, child, null);
	});
	
	return ret;
}

/*
A scaffold firstly consists of a heirarchical structure (skeleton) that is the object inheritance hierarchy.
Calling scaffold(skeleton, topName) then creates a type for each entry in the skeleton.

Next, properties (prop.XXX) are defined in terms of their types.
Each type made by the scaffold has a make(inst) method which creates an instance of that type.
	The instance has get.XXX for each property,
		where get.XXX is an output pin if the property's type is an interface
		get.XXX is a getter function if the property's type is just an ordinary type
			these are set initially based on the inst object passed into make
	The instance has control.XXX for each property if the property's type is an interface
		this is for controlling the get.XXX outputPin
*/


var kernel = scaffold({
	ob: {
		situation: {},
		individual: {},
		relation: {},
		infon: {}
	}
}, "kernel");

kernel.ob.prop = {
	parentSituation: interfaces.unit(kernel.situation),
	content: interfaces.unit(basic.js),
	involves: interfaces.set(kernel.infon),
	correspondsIn: interfaces.set(kernel.ob),
	correspondOut: interfaces.unit(kernel.ob)
};

kernel.situation.prop = {
	childObjects: interfaces.set(kernel.ob)
};

var childrenByTypeXML = loadXMLNow(ROOTDIR + "xml/autoderive/childrenByType.xml");
kernel.situation.auto = {
	childrenByType: {
		type: interfaces.assoc(kernel.ob, interfaces.set(kernel.ob)),
		deriver: function (o) {
			return derive(childrenByTypeXML, {focus: startCaps.unit(o)});
		}
	}
};

kernel.individual.prop = {
};

kernel.relation.prop = {
	infons: interfaces.set(kernel.infon)
};

kernel.infon.prop = {
	relation: interfaces.unit(kernel.relation),
	arcs: interfaces.assoc(basic.string, basic.alt(kernel.ob, basic.number, basic.string))
};