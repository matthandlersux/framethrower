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
		}
	};
})();