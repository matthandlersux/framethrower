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
	getKind = (focus -> bindUnit (x -> returnUnit (getKindHelper x)) (length (getChildren focus))),
	// isSituation = (focus -> mapUnit (equal "Situation") (getKind focus)),
	isSituation = (focus -> (bindUnit (x -> boolToUnit (equal "Situation" x)) (getKind focus))),
	
	<div>
		<f:call>prepareState</f:call>
		<f:call>drawSituation shared.realLife 600 400</f:call>
	</div>
}