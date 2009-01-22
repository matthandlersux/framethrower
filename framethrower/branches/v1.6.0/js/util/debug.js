var debug = (function () {
	var runningTotals = {};
	
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
		},
		
		
		
		
		profile: function (name, value) {
			if (!runningTotals[name]) {
				runningTotals[name] = {
					max: -999999999999,
					min: 999999999999,
					average: 0,
					count: 0,
					dist: []
				};
			}
			var r = runningTotals[name];
			r.max = Math.max(r.max, value);
			r.min = Math.min(r.min, value);
			r.count++;
			r.average = (r.average * (r.count - 1) + value) / r.count;
			if (!r.dist[value]) r.dist[value] = 0;
			r.dist[value]++;
		},
		getResults: function (name) {
			return runningTotals[name];
		}
	};
})();