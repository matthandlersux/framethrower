template (focus::Situation, globalPosition::Position, scale::Unit Number) {
	
	children = state(Map Situation ChildProp),
	expandedScale = state(Unit Number),
	collapsedScale = state(Unit Number),
	//hack
	initialized = state(Unit Null),
	
	
	<f:wrapper>
		<f:trigger Situation:contains focus as child>
			position = create(Position),
			dragPosition = create(Position),
			add(Position:x position, 0),
			add(Position:y position, 0),
			childProp = create(ChildProp, {position:position, dragPosition:dragPosition}),
			add(children, child, childProp)
		</f:trigger>
		
		<f:each reactiveNot initialized as _>
			<f:each scale as scale>
				<f:on init>
					add(expandedScale, divBy 2 scale),
					add(collapsedScale, divBy 3 scale),
					add(initialized, null)
				</f:on>
			</f:each>
		</f:each>
	
		<svg:circle class="situationView-situation" r="{scale}" cx="0" cy="0" shape-rendering="optimizeSpeed" />
		<f:call>drawArtifacts focus</f:call>
		
		<f:each children as situation, childProp>
			childPosition = ChildProp:position childProp,
			<f:each childPosition as childPosition>
				scaledX = testMapUnit2 mult scale (Position:x childPosition),
				scaledY = testMapUnit2 mult scale (Position:y childPosition),
				globalX = testMapUnit2 plus scaledX (Position:x globalPosition),
				globalY = testMapUnit2 plus scaledY (Position:y globalPosition),
				position = state{create(Position, {x:globalX, y:globalY})},
				content = 
					<f:wrapper>
						<f:call>
							dragX = state(Unit Number),
							dragY = state(Unit Number),
							onDrop = action(x::Number, y::Number) {
								scale = extract scale,
								currentX = extract Position:x childPosition,
								currentY = extract Position:y childPosition,
								add(Position:x childPosition, plus currentX (divBy scale x)),
								add(Position:y childPosition, plus currentY (divBy scale y))
							},
							dragdrop dragX dragY onDrop
						</f:call>
						<f:call>drawSituation situation position expandedScale</f:call>
					</f:wrapper>,
				<f:call>containSVG scaledX scaledY content</f:call>
			</f:each>
		</f:each>
		
	</f:wrapper>	
	
}