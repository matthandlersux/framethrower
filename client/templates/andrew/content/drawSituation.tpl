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
				<f:wrapper>
					<f:each Position:x childPosition as currentX><f:each Position:y childPosition as currentY>
						dragX = state(Unit Number),
						dragY = state(Unit Number),
						onDrop = action(x::Number, y::Number) {
							add(Position:x childPosition, divBy scale (plus currentX x)),
							add(Position:y childPosition, divBy scale (plus currentY y))
						},
						dragdrop dragX dragY onDrop
					</f:each></f:each>
					// <f:each Position:x childPosition as initX><f:each Position:y childPosition as initY>
					// 	dragUpdateX = action(x::Number) {
					// 		add(Position:x dragPosition, divBy scale (plus initX x))
					// 	},
					// 	dragUpdateY = action(y::Number) {
					// 		add(Position:y childPosition, divBy scale (plus initY y))
					// 	},
					// 	dragdrop dragUpdateX dragUpdateY
					// </f:each></f:each>
					<f:call>
						scaledX = testMapUnit2 mult scale (Position:x childPosition),
						scaledY = testMapUnit2 mult scale (Position:y childPosition),
						globalX = testMapUnit2 plus scaledX (Position:x globalPosition),
						globalY = testMapUnit2 plus scaledY (Position:y globalPosition),
						position = state{create(Position, {x:globalX, y:globalY})},
						content = drawSituation situation position expandedScale,
						<f:call>containSVG scaledX scaledY</f:call>
					</f:call>
				</f:wrapper>
			</f:each>
		</f:each>
		
	</f:wrapper>	
	
}