var debug = (function () {
	return {
		log: function (arg) {
			console.log(arg);
		},
		xml: function (xml) {
			if (console && console.dirxml) {
				console.dirxml(xml);
			} else {
				console.log(serializeXML(xml));
			}
		},
		error: function (arg) {
			if (console.error) {
				console.error.apply(console, arguments);
			} else {
				
			}
			throw arg;
		}
	};
})();