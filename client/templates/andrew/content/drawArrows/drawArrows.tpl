template (allPositions::Set SV.shape) {
	
	infons = filter (x -> bindUnit isInfon (returnFutureUnit (SV.shape:focus x))) allPositions,
	
	<svg:g>
		<f:each infons as infon>
			drawInfonArrows infon
		</f:each>
	</svg:g>
}