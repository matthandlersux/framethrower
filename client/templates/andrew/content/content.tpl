template () {
	//"abstraction layer functions" - interface to the ontology which will likely change a lot
	getChildren = getEveryIn,
	getArtifacts = getName,	//make this get pictures and such later
	isSituation = focus -> contains (getTypes focus) shared.type.situation,
	isInfon = focus -> contains (getTypes focus) shared.type.infon,
	getArguments = getInfonArguments,
	
	//UI state
	allPositions = state(Map Object SV.shape),
	
	<div>
		<f:call>prepareState</f:call>
		<f:call>drawSituation shared.realLife 600 400</f:call>
		<div class = "situationView-arrows">
			<f:call>drawArrows allPositions</f:call>
		</div>
	</div>
}