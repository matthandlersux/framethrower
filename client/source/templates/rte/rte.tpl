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
		
		return arrayToList(chapters);
	},
	
	getFrame = function (time::Number)::String {
		return "url(http:/"+"/media.eversplosion.com/mrtesting/frame.php?time="+time+")";
	},
	
	zoomFactorS = state(Unit Number, 1),
	zoomFactor = fetch zoomFactorS,
	
	zoomIn = action () {
		set zoomFactorS (plus zoomFactor 0.1)
	},
	zoomOut = action () {
		set zoomFactorS (subtract zoomFactor 0.1)
	},
	
	scrollAmountS = state(Unit Number, 0),
	scrollAmount = fetch scrollAmountS,
	
	<div>
		<div style-width="1000" style-height="200" style-overflow="hidden" style-position="absolute" style-border="1px solid #000">
			<f:call>
				dragStart = state(Unit Number),
				scrollAmountStart = state(Unit Number),
				<f:wrapper>
					<f:on mousedown>
						set dragStart event.mouseX,
						set scrollAmountStart scrollAmount
					</f:on>
					<f:each dragStart as from>
						start = fetch scrollAmountStart,
						<f:wrapper>
							<f:on globalmouseup>
								unset dragStart
							</f:on>
							<f:on globalmousemove>
								set scrollAmountS (plus (subtract event.mouseX from) start)
							</f:on>
						</f:wrapper>
					</f:each>
					<f:on mousescroll>
						set zoomFactorS (plus zoomFactor (multiply 0.1 (sign event.wheelDelta)))
					</f:on>
					
				</f:wrapper>
			</f:call>
			<div style-position="absolute" style-left="{scrollAmount}">
				<f:each chapters as chapter>
					<div style-left="{multiply (fst chapter) zoomFactor}" style-width="{multiply (subtract (snd chapter) (fst chapter)) zoomFactor}" style-position="absolute" style-height="100">
						<div style-padding="4" style-border-right="1px solid #ccc">
							<div style-height="100" style-background-image="{getFrame (fst chapter)}" style-background-repeat="no-repeat" style-background-position="center center" />
						</div>
						//{fst chapter}, {snd chapter}
					</div>
				</f:each>
			</div>
		</div>
		<div style-position="absolute" style-top="300">
			<div>
				<f:on click>zoomIn</f:on>
				In
			</div>
			<div>
				<f:on click>zoomOut</f:on>
				Out
			</div>
		</div>
	</div>
}