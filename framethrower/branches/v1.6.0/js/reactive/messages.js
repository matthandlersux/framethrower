//to be improved...

var messageEnum = {
	set : "set",
	remove : "remove"
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
	}
};