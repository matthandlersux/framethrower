template () {
	//"abstraction layer functions" - interface to the ontology which will likely change a lot
	// getChildren = getEveryIn,
	getArtifacts = Situation:propName,	//make this get pictures and such later
	// isSituation = focus -> contains (getTypes focus) shared.type.situation,
	// isInfon = focus -> contains (getTypes focus) shared.type.infon,
	// getArguments = getInfonArguments,
	

	divBy = function (d::Number, q::Number)::Number {
		return q / d;
	},
	
	mult = function (x::Number, y::Number)::Number {
		return x*y;
	},
	
	containSVG = template (x::Unit Number, y::Unit Number, content::XMLP) {
		makeTranslateString = function(x, y) {
			return "translate(" + x + "," + y + ")";
		},
		translate = mapUnit2 makeTranslateString x y,
		<svg:g transform="{translate}">
			<f:call>content</f:call>
		</svg:g>
	},
	
	//UI state
	locations = state(Map Situation ShapePosition),
	situations = state(Map Situation ChildProp),

	rootScale = state{rs = create(Unit Number), add(rs, 200), rs},

	<div>
		<f:call>prepareState</f:call>
		<f:on init>
			position = create(Position),
			dragPosition = create(Position),
			add(Position:x position, 200),
			add(Position:y position, 200),
			childProp = create(ChildProp, {position:position, dragPosition:dragPosition}),
			add(situations, tobytest.realLife, childProp)
		</f:on>
		<f:each crazyTest>
			<div>hey</div>
		</f:each>
		<svg:svg id="svgelements">
			<f:each situations as situation, childProp><f:each ChildProp:position childProp as position>
				content = drawSituation situation position rootScale,
				<f:call>containSVG (Position:x position) (Position:y position) content</f:call>
			</f:each></f:each>
			// <f:call>drawArrows allPositions</f:call>
		</svg:svg>
	</div>
}