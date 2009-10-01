//template (timestamps::List (Tuple2 (Tuple2 Number Number) a))::List (Tuple2 (Tuple2 Number Number) (List (Tuple2 (Tuple2 Number Number) a))) {
//	js = function (divisions::Number, totalDuration::Number, timestamps::List (Tuple2 (Tuple2 Number Number) a))::List (Tuple2 (Tuple2 Number Number) (List (Tuple2 (Tuple2 Number Number) a))) {
template (timestamps::List b)::List ((Number, Number), (List (Number, Number))) {
	divisions = 18,
	js = function (divisions::Number, totalDuration::Number, timestamps::List b)::List ((Number, Number), (List (Number, Number))) {

		var ret = [];
		for (var i = 0; i < divisions; i++) {
			var stamps = [];
			var min = Infinity;
			var max = -Infinity;
			forEach(timestamps.asArray, function (pair) {
				var start = i * totalDuration / divisions;
				var end = (i+1) * totalDuration / divisions;
				if (pair.asArray[0] >= start && pair.asArray[0] < end) {
					stamps.push(pair);
					
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