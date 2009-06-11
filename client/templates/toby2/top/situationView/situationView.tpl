template (width::Unit Number, height::Unit Number, children::Map Situation ChildProp) {
	
	// Utility
	makeTranslate = function(x, y) {
		return "translate(" + x + "," + y + ")";
	},
	
	
	// x and y represent, in global coordinates, the center of where the situation should be drawn
	// scale represents, in global coordinates, the radius of the circle or image that represents the situation
	// focus is the situation to be drawn
	drawSituation = template (x::Unit Number, y::Unit Number, scale::Unit Number, focus::Situation, dragHandler::XMLP) {
		children = state(Map Situation ChildProp),
		<svg:g>
			
			// population of childProp (for now this just populates childProp with all the situation's children)
			<f:trigger Situation:contains focus as child>
				position = create(Position),
				dragPosition = create(Position),
				add(Position:x position, 0),
				add(Position:y position, 0),
				childProp = create(ChildProp, {position:position, dragPosition:dragPosition}),
				add(ChildProp:scale childProp, 0.5),
				add(children, child, childProp)
			</f:trigger>
			
			<svg:g class="situationView-situation">
				<f:call>dragHandler</f:call>
				<svg:circle r="{scale}" cx="{x}" cy="{y}" shape-rendering="optimizeSpeed">
					
				</svg:circle>
				<svg:text x="{x}" y="{mapUnit2 subtract y scale}" text-anchor="middle" shape-rendering="optimizeSpeed">
					{scale}
				</svg:text>
			</svg:g>
			<f:call>drawSituationChildren x y scale children</f:call>
		</svg:g>
	},
	
	// children is a Map of Situations (to draw) and their ChildProp (which tells if, where, and how big to draw them)
	drawSituationChildren = template (x::Unit Number, y::Unit Number, scale::Unit Number, children::Map Situation ChildProp) {
		<f:each children as child, childProp>
			childPosition = returnFutureUnit (ChildProp:position childProp),
			childX = bindUnit Position:x childPosition,
			childY = bindUnit Position:y childPosition,
			childAbsX = mapUnit2 plus x (mapUnit2 multiply scale childX),
			childAbsY = mapUnit2 plus y (mapUnit2 multiply scale childY),
			childScale = mapUnit2 multiply (ChildProp:scale childProp) scale,
			
			dragX = state(Unit Number),
			dragY = state(Unit Number),
			onDrop = action (x::Number, y::Number) {
				scale = extract scale,
				childPosition = extract childPosition,
				currentX = extract Position:x childPosition,
				currentY = extract Position:y childPosition,
				add(Position:x childPosition, plus currentX (divide x scale)),
				add(Position:y childPosition, plus currentY (divide y scale))
			},
			dragHandler = dragdrop dragX dragY onDrop,
			
			draggerDisplay = reactiveIfThen dragX "block" "none",
			
			<f:wrapper>
				<f:call>drawSituation childAbsX childAbsY childScale child dragHandler</f:call>
				<svg:circle class="dragCircle" style-display="{draggerDisplay}" r="{childScale}" cx="{mapUnit2 plus childAbsX dragX}" cy="{mapUnit2 plus childAbsY dragY}" />
			</f:wrapper>
		</f:each>
	},
	
	<svg:svg style-width="{width}" style-height="{height}">
		<svg:g transform="{mapUnit2 makeTranslate (mapUnit (swap divide 2) width) (mapUnit (swap divide 2) height)}">
			<f:call>
				drawSituationChildren (returnUnit 0) (returnUnit 0) (mapUnit (swap divide 2) height) children
			</f:call>
		</svg:g>
	</svg:svg>
}