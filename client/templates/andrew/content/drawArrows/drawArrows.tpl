template (allPositions::Set SV.shape) {
	
	infons = filter (x -> bindUnit isInfon (returnFutureUnit (SV.shape:focus x))) allPositions,
	
	<f:each infons as infon>
		drawInfonArrows infon
	</f:each>
}