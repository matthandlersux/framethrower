template () {
	// // x = 6,
	// // y = plus x 12,
	// // z = state {
	// // 	z <- create(Set Number),
	// // 	add(z, 145),
	// // 	return z
	// // },
	// <div>
	// 	hello rte
	// 	// <div contentEditable="true" id="super">blah</div>
	// 	// {x} {y}
	// 	// <br />
	// 	// {z}
	// </div>	
	
	chapters = function ()::List (Tuple2 Number Number) {
		timestamps = [
			0,
			76.504,
			330.36,
			645.027,
			782.953,
			849.25,
			1259.26,
			1504.747,
			1652.425,
			1881.022,
			2142.717,
			2403.444,
			2668.112,
			2922.136,
			3206.031,
			3303.444,
			3459.073,
			3571.328,
			3680.688,
			3937.237,
			4075.511,
			4358.248,
			4682.244,
			5126.301,
			5222.668,
			5383.006,
			5515.278,
			5689.8,
			5773.141,
			5922.633,
			6136.257,
			6457.204,
			6684.822,
			6792.397,
			7112.384,
			7213.751,
			7660.804
		];
		var endTime = 7668.189;
		
		var chapters = [];
		forEach(timestamps, function (timestamp, i) {
			var next = (i === timestamps.length - 1) ? endTime : timestamps[i+1];
			var chapter = makeTuple2(timestamp, next);
			chapters.push(chapter);
		});
		
		console.log(arrayToList(chapters));
		
		return arrayToList(chapters);
	},
	
	<div>
		blah
		<f:each chapters as chapter>
			<div>
				{fst chapter}, {snd chapter}
			</div>
		</f:each>
	</div>
}