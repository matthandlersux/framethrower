var user = function() {
	var ont = rootObjects['shared.ont'];
	var history = rootObjects['shared.history'];
	var users = rootObjects['shared.users'];
	var changeRelation = rootObjects['shared.history.change'];
	var sharedIn = rootObjects['shared.in'];
	var name = rootObjects['shared.name'];
	var isType = rootObjects['shared.isType'];
	var dateType = rootObjects['shared.type.date'];
	var trueObj = rootObjects['shared.bool.true'];
	var falseObj = rootObjects['shared.bool.false'];
	var currentUser;

	function createObject(type, properties) {
		// properties has all of the "future" properties, reactive properties should start out as empty
		//console.log("createObject called", arguments);

		return objects.make(type, properties);
	}
	
	function intact(object, property, action, key, value) {
		if (DEBUG) {
			if (!object.prop[property]) {
				debug.error("intact failed. Object does not have property `"+property+"`", object);
			}
		}

		// params has properties key and value, or just key
		objects.actOnProp(property, object, action, key, value);
		//object.prop[property].control[action](key, value);
	}

	function makeCons(left, right) {
		var cons = createObject("Cons", {left:left, right:right});
		intact(left, "upRight", "add", cons);
		intact(right, "upLeft", "add", cons);
		return cons;
	}


	function putInOnt(infon) {
		var inOnt = makeCons(sharedIn, ont);
		var infonInOnt = makeCons(objects.cast(inOnt, "Object"), objects.cast(infon, "Object"));
		intact(infonInOnt, "truth", "add", nullObject);
	}

	function nameObject(object, nameString) {
		var nameObj = createObject("X.text", {string: nameString});
		var nameIs = makeCons(name, object);
		var nameIsName = makeCons(objects.cast(nameIs, "Object"), objects.cast(nameObj, "Object"));
		putInOnt(nameIsName);
	}
	
	function typeObject(object, type) {
		var typeIs = makeCons(isType, object);
		var typeIsType = makeCons(typeIs, type);
		putInOnt(typeIsType);
	}
	
	function logHistory(object, change) {
		var truth;
		if(change.kind == "add") {
			truth = trueObj;
		} else {
			truth = falseObj;
		}

		var timeObj = createObject("Object");
		var currentTime = Date();
		nameObject(timeObj, currentTime);
		typeObject(timeObj, dateType);

		var cons1 = makeCons(changeRelation, currentUser);
		var cons2 = makeCons(cons1, object);
		var cons3 = makeCons(cons2, truth);
		var cons4 = makeCons(cons3, timeObj);

		var incons1 = makeCons(sharedIn, history);
		var incons2 = makeCons(incons1, cons4);
		intact(incons2, "truth", "add", nullObject);
	
	}
	
	function signIn(userName) {
		currentUser = createObject("Object");
		var inusers = makeCons(sharedIn, users);
				
		var userInUsers = makeCons(objects.cast(inusers, "Object"), currentUser);
		intact(userInUsers, "truth", "add", nullObject);
		
		nameObject(currentUser, userName);
	}

	if(LOCAL) {
		signIn("Anonymous");
	}
	
	return {
		logHistory: logHistory,
		signIn: signIn
	};
}();