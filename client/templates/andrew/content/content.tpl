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
	
	rootWidth = state{rw = create(Unit Number), add(rw, 600), rw},
	rootHeight = state{rh = create(Unit Number), add(rh, 400), rh},
	
	containSVG = template (x::Unit Number, y::Unit Number, content::XMLP) {
		makeTranslateString = function(x, y) {
			return "translate(" + x + "," + y + ")";
		},
		translate = mapUnit2 makeTranslateString x y,
		<svg:g transform="{translate}">
			<f:call>content</f:call>
		</svg:g>
	},
	containHTML = template (x::Unit Number, y::Unit Number, content::XMLP) {
		<div style-left="{x}" style-top="{y}">
			<f:call>content</f:call>
		</div>
	},
	dragdropSVG = dragdrop containSVG,
	dragdropHTML = dragdrop containHTML,

	<div>
		<f:call>prepareState</f:call>
		<svg:svg id="svgelements">
			<f:call>drawSituation shared.realLife rootWidth rootHeight</f:call>
			<f:call>drawArrows allPositions</f:call>
		</svg:svg>
	</div>
}