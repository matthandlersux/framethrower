template () {
	rulerMarkings = function (duration::Number)::List Number {
		var markings = [];
		for (var i = 0; i < duration; i += 600) {
			markings.push(i);
		}
		return arrayToList(markings);
	},
	secondaryMarkings = function (duration::Number)::List Number {
		var markings = [];
		for (var i = 0; i < duration; i += 60) {
			if (i%600 !== 0) {
				markings.push(i);				
			}
		}
		return arrayToList(markings);
	},
	
	showSecondary = fetch (lowPassFilter (unfetch (greaterThan zoomFactor 1.4))),
	
	// Ruler markings
	<div style-position="absolute" style-top="0" style-left="0" style-width="100%" style-height="100%">
		<f:each rulerMarkings movieDuration as rulerMarking>
			<div style-left="{makePercent (divide rulerMarking movieDuration)}" style-top="0" style-height="100%" style-border-left="1px dashed #999" style-color="#999" style-font-size="11" style-padding-left="3" style-position="absolute">
				{formatTime rulerMarking}
			</div>
		</f:each>
		<div style-display="{boolToDisplay showSecondary}">
			<f:each secondaryMarkings movieDuration as rulerMarking>
				<div style-left="{makePercent (divide rulerMarking movieDuration)}" style-top="0" style-height="100%" style-border-left="1px dotted #bbb" style-color="#bbb" style-font-size="11" style-padding-left="3" style-position="absolute">
					{formatTime rulerMarking}
				</div>
			</f:each>
		</div>
	</div>
}