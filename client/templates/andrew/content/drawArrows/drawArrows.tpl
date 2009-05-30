template (allPositions::Set SV.shape) {
	
	infons = filter (x -> bindUnit isInfon (returnFutureUnit (SV.shape:focus x))) allPositions,
	
	<svg:svg id="svgelements">
		<svg:g>
			<svg:path d="M 0,5  T800,800" class="link"/>
		</svg:g>
		<svg:g>
			<f:each infons as infon>
				drawInfonArrows infon
			</f:each>
		</svg:g>
	</svg:svg>
}