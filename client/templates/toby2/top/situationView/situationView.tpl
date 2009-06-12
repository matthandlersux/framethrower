template (width::Unit Number, height::Unit Number, children::Map Situation ChildProp) {
	
	// Utility
	makeTranslate = function(x, y) {
		return "translate(" + x + "," + y + ")";
	},
	reactiveDisplay = pred -> reactiveIfThen pred "block" "none",
	// placeWithinBoundsX = function (outerRadius, x, y, innerRadius) {
	// 	if (x^2 + y^2 > (outerRadius - innerRadius)^2) {
	// 		return Math.sqrt((outerRadius - innerRadius)^2 * x^2 / (x^2 + y^2));
	// 	} else {
	// 		return x;
	// 	}
	// },
	// placeWithinBoundsY = function (outerRadius, x, y, innerRadius) {
	// 	if (x^2 + y^2 > (outerRadius - innerRadius)^2) {
	// 		return Math.sqrt((outerRadius - innerRadius)^2 * y^2 / (x^2 + y^2));
	// 	} else {
	// 		return y;
	// 	}
	// },
	
	
	
	
	dragStartSit = state(Unit Situation),
	dragEndSit = state(Unit Situation),
	dragEndInside = state(Unit Null),
	
	
	globalScale = state{s=create(Unit Number), add(s, 1), s},
	globalTranslateX = state{x=create(Unit Number), add(x, 0), x},
	globalTranslateY = state{y=create(Unit Number), add(y, 0), y},
	
	
	// x and y represent, in global coordinates, the center of where the situation should be drawn
	// scale represents, in global coordinates, the radius of the circle or image that represents the situation
	// focus is the situation to be drawn
	drawSituation = template (x::Unit Number, y::Unit Number, scale::Unit Number, focus::Situation, dragHandler::XMLP) {
		children = state(Map Situation ChildProp),
		<svg:g>
			
			// population of childProp (for now this just populates childProp with all the situation's children)
			<f:trigger Situation:contains focus as child>
				position = create(Position),
				add(Position:x position, 0),
				add(Position:y position, 0),
				childProp = create(ChildProp, {position:position}),
				add(ChildProp:scale childProp, 0.5),
				add(children, child, childProp)
			</f:trigger>
			
			<svg:g class="gsv-situation">
				<f:call>dragHandler</f:call>
				<svg:circle class="gsv-icon" r="{scale}" cx="{x}" cy="{y}" shape-rendering="optimizeSpeed" />
				<svg:circle class="gsv-hit" r="{scale}" cx="{x}" cy="{y}" shape-rendering="optimizeSpeed" />
				<svg:text x="{x}" y="{mapUnit2 subtract y scale}" text-anchor="middle" shape-rendering="optimizeSpeed">
					{scale}
				</svg:text>
			</svg:g>
			<f:call>drawSituationChildren x y scale children</f:call>
		</svg:g>
	},
	
	// children is a Map of Situations (to draw) and their ChildProp (which tells if, where, and how big to draw them)
	drawSituationChildren = template (x::Unit Number, y::Unit Number, scale::Unit Number, children::Map Situation ChildProp) {
		relToAbsX = relX -> mapUnit2 plus x (mapUnit2 multiply scale relX),
		relToAbsY = relY -> mapUnit2 plus y (mapUnit2 multiply scale relY),
		
		<f:each children as child, childProp>
			childPosition = returnFutureUnit (ChildProp:position childProp),
			childX = bindUnit Position:x childPosition,
			childY = bindUnit Position:y childPosition,
			
			childAbsX = relToAbsX childX,
			childAbsY = relToAbsY childY,
			childScale = mapUnit2 multiply (ChildProp:scale childProp) scale,
			
			dragX = state(Unit Number),
			dragY = state(Unit Number),
			draggedToX = mapUnit2 plus childX (mapUnit2 divide dragX scale),
			draggedToY = mapUnit2 plus childY (mapUnit2 divide dragY scale),
			
			onDrop = action () {
				childPosition = extract childPosition,
				draggedToX = extract draggedToX,
				draggedToY = extract draggedToY,
				add(Position:x childPosition, draggedToX),
				add(Position:y childPosition, draggedToY)
			},
			dragHandler = dragdrop dragX dragY onDrop,
			
			<f:wrapper>
				<f:call>drawSituation childAbsX childAbsY childScale child dragHandler</f:call>
				<svg:circle class="dragCircle" style-display="{reactiveDisplay dragX}" r="{childScale}" cx="{relToAbsX draggedToX}" cy="{relToAbsY draggedToY}" pointer-events="none" />
			</f:wrapper>
		</f:each>
	},
	
	<svg:svg style-width="{width}" style-height="{height}">
		<svg:g transform="{mapUnit2 makeTranslate (mapUnit2 plus (mapUnit (swap divide 2) width) globalTranslateX) (mapUnit2 plus (mapUnit (swap divide 2) height) globalTranslateY)}">
			<f:call>
				drawSituationChildren (returnUnit 0) (returnUnit 0) (mapUnit2 multiply globalScale (mapUnit (swap divide 2) height)) children
			</f:call>
		</svg:g>
		
		<f:call>mouseScrollAction</f:call>
	</svg:svg>
}