//to be improved...

var messageEnum = {
	set : "set",
	remove : "remove",
	setAssoc : "setAssoc"
};

var makeMessage = {
	set : function (val) {
		return {
			action : messageEnum.set,
			value : val
		};
	},
	remove : function (val) {
		return {
			action : messageEnum.remove,
			value : val
		};
	},
	setAssoc : function (key, val) {
		return {
			action : messageEnum.setAssoc,
			key : key,
			value : val
		};
	}
};