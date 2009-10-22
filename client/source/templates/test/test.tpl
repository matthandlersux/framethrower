template () {
	xS = state(Unit Number, 100),
	
	xfetched = fetch xS,
	xS2 = unfetch xfetched,
	
	moveIt = action (start, xOffset) {
		set xS (plus start xOffset)
	},
	
	
	<div style-position="absolute" style-left="{xS}">
		drag me
		<f:call>
			// dragger xS moveIt
			dragger xS2 moveIt
		</f:call>
	</div>
}