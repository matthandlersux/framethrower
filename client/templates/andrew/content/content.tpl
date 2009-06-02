template () {
	//"abstraction layer functions" - interface to the ontology which will likely change a lot
	// getChildren = getEveryIn,
	getArtifacts = Situation:propName,	//make this get pictures and such later
	// isSituation = focus -> contains (getTypes focus) shared.type.situation,
	// isInfon = focus -> contains (getTypes focus) shared.type.infon,
	// getArguments = getInfonArguments,
	

	divBy = function (d::Number, q::Number)::Number {
		return q/d;
	},
	
	//UI state
	locations = state(Map Situation ShapePosition),
	situations = state(Map Situation ChildProp),

	rootWidth = state{rw = create(Unit Number), add(rw, 600), rw},
	rootHeight = state{rh = create(Unit Number), add(rh, 400), rh},
	rootScale = state{rs = create(Unit Number), add(rs, 200), rs},

	<div>
		<f:call>prepareState</f:call>
		<f:on init>
			position = create(Position),
			add(Position:x position, 0),
			add(Position:y position, 0),
			childProp = create(ChildProp, {position:position}),
			add(situations, tobytest.realLife, childProp)
		</f:on>
		<svg:svg id="svgelements">
			<f:each situations as situation, childProp>
				position = state(Position),
				<f:wrapper>
					<f:on init>
						// need to make this initialize the locations based on rootWidth and rootHeight
						// need ability to extract in actions to do this I think
						x = divBy 2 600,
						y = divBy 2 400,
						add(Position:x position, x),
						add(Position:y position, y),
					</f:on>
					<f:call>
						content = drawSituation situation position rootScale,
						childPosition = ChildProp:position childProp,
						<f:each childPosition as childPosition>
							xToDraw = testMapUnit2 plus (Position:x childPosition) (Position:x position),
							yToDraw = testMapUnit2 plus (Position:y childPosition) (Position:y position),
							dragdropSVG content xToDraw yToDraw
						</f:each>
					</f:call>
				</f:wrapper>
			</f:each>
			// <f:call>drawArrows allPositions</f:call>
		</svg:svg>
	</div>
}