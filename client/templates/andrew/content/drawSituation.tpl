template (focus::Situation, globalPosition::Position, scale::Unit Number) {
	
	children = state(Map Situation ChildProp),
	
	
	<f:wrapper>
		<f:trigger Situation:contains focus as child>
			position = create(Position),
			add(Position:x position, 0),
			add(Position:y position, 0),
			childProp = create(ChildProp, {position:position}),
			add(children, child, childProp)
		</f:trigger>
	
		<svg:circle class="situationView-situation" r="{scale}" cx="0" cy="0" shape-rendering="optimizeSpeed" />
		<f:call>drawArtifacts focus</f:call>
		
		<f:each children as situation, childProp>
			<f:call>
				childPosition = ChildProp:position childProp,
				<f:each childPosition as childPosition>
					xToDraw = testMapUnit2 plus (Position:x childPosition) (Position:x position),
					yToDraw = testMapUnit2 plus (Position:y childPosition) (Position:y position),
					position = state{create(Position, {x:xToDraw, y:yToDraw})},
					content = drawSituation situation position rootScale,
					dragdropSVG content xToDraw yToDraw
				</f:each>
			</f:call>
		</f:each>		
		
	</f:wrapper>	
	
}