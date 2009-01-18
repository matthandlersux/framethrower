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
				console.warn.apply(console, arguments);
				// my firebug won't give a stack trace with console.error so instead I do an error. This may be fixed with a newer/alpha Firebug?
				thisIsNotDefined(); // Firebug stack trace hack
				//console.error.apply(console, arguments);
			} else {
				
			}
			throw arg;
		}
	};
})();