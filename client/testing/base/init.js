function initialize() {
	
	forEach(base.debug(), function (o, name) {
		console.log(name, unparseType(getType(o)));
	});
}