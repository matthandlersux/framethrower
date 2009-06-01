template () {
	//"abstraction layer functions" - interface to the ontology which will likely change a lot
	getChildren = getEveryIn,
	getArtifacts = getName,	//make this get pictures and such later
	isSituation = focus -> contains (getTypes focus) shared.type.situation,
	isInfon = focus -> contains (getTypes focus) shared.type.infon,
	getArguments = getInfonArguments,
	

	equalsFocus = obj -> shape -> bindUnit (reactiveEqual obj) (returnFutureUnit (SV.shape:focus shape)),
	findBestMatch = arg -> allPositions -> takeOne (filter (equalsFocus arg) allPositions),
	
	//UI state
	allPositions = state(Set SV.shape),
	
	<div>
		<f:call>prepareState</f:call>
		<svg:svg id="svgelements">
			<f:call>drawSituation shared.realLife 0 0 600 400</f:call>
			<f:call>drawArrows allPositions</f:call>
		</svg:svg>
	</div>
}