template () {
	//abstraction layer functions
	getChildren = getEveryIn,
	getArtifacts = getName,	//make this get pictures and such later
	// getType
	// isSituation = (focus -> mapUnit (equal "Situation") (getKind focus)),
	isSituation = focus -> contains (getTypes focus) shared.type.situation,
	isInfon = focus -> contains (getTypes focus) shared.type.infon,
	
	allPositions = state(Set SV.shape),
	
	<div>
		<f:call>prepareState</f:call>
		<f:call>drawSituation shared.realLife 600 400</f:call>
	</div>
}