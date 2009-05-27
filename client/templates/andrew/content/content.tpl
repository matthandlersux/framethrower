template () {
	//abstraction layer functions
	getChildren = getAllIn,
	getArtifacts = getName,	//make this get pictures and such later
	// getType
	getKindHelper = function (numChildren::Number) {
		if (numChildren > 0) {
			return "Situation";
		} else {
			return "Object";
		}
	},
	getKind = (focus -> bindUnit (x -> returnUnit (getKindHelper x)) (getChildren focus)),
	isSituation = (focus -> equal (getKind focus) "Situation"),
	
	<div>
		<f:call>prepareState</f:call>
		<f:call>drawSituation shared.realLife 300 300</f:call>
	</div>
}