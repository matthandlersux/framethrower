template () {
	xS = state(Unit Number, 100),
	
	xS2 = unfetch (fetch xS),
	//xS2 = xS,
	
	moveIt = action (start, xOffset) {
		set xS (plus start xOffset)
	},
	
	
	<div style-position="absolute" style-left="{xS}">
		drag me
		//{xS2}
		<f:call>
			// dragger xS moveIt
			dragger xS2 moveIt
		</f:call>
	</div>
}