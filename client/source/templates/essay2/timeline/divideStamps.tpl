template (divisions::Number, timestamps::List (TimeRange, d))::List (TimeRange, (List (TimeRange, d))) {
	
	js = function (divisions::Number, totalDuration::Number, timestamps::List (TimeRange, d))::List (TimeRange, (List (TimeRange, d))) {
		var ret = [];
		for (var i = 0; i < divisions; i++) {
			var stamps = [];
			var min = Infinity;
			var max = -Infinity;
			forEach(timestamps.asArray, function (rangedObs) {
				var pair = rangedObs.asArray[0];
				var start = i * totalDuration / divisions;
				var end = (i+1) * totalDuration / divisions;
				if (pair.asArray[0] >= start && pair.asArray[0] < end) {
					stamps.push(makeTuple2(pair, rangedObs.asArray[1]));
					
					if (pair.asArray[0] < min) min = pair.asArray[0];
					if (pair.asArray[0] + pair.asArray[1] > max) max = pair.asArray[0] + pair.asArray[1];
				}
			});
			ret.push(makeTuple2(makeTuple2(min, max-min), arrayToList(stamps)));
		}
		
		return arrayToList(ret);
	},
	js divisions movieDuration timestamps
}