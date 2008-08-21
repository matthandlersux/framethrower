function scaffold(skeleton) {
	var ret = {};
	function add(name, o, parent) {
		var type = makeType();
		
		type.parent = parent;
		type.prop = {};
		
		type.make = function (inst) {
			var instance = makeIded(type);
			
			instance.get = {};
			instance.control = {};
						
			function addProperties(t) {
				forEach(t.prop, function (propType, name) {
					if (propType.instantiate) {
						instance.control[name] = {};
						instance.get[name] = makeSimpleStartCap(propType, instance.control[name]);
					} else {
						instance.get[name] = getter(inst[name]);
					}
				});
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




var kernel = scaffold({
	ob: {
		situation: {},
		individual: {},
		relation: {},
		infon: {}
	}
});

kernel.ob.prop = {
	parentSituation: kernel.situation,
	content: interfaces.unit(basic.js),
	involves: interfaces.set(kernel.infon),
	correspondsIn: interfaces.set(kernel.ob),
	correspondOut: interfaces.unit(kernel.ob)
};

kernel.situation.prop = {
	childObjects: interfaces.set(kernel.ob)
};

kernel.individual.prop = {
};

kernel.relation.prop = {
	infons: interfaces.set(kernel.infon)
};

kernel.infon.prop = {
	relation: kernel.relation
};




var layout = scaffold({
	pane: {
		paneSet: {},
		viewer: {}
	}
});