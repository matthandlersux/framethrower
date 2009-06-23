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
	
	// dragOperation can be
	// 1 - offset (changing a position)
	// 2 - move/copy into
	// 3 - make infon/pipe
	dragOperation = bindUnit (swap (reactiveIfThen dragEndInside) 2) (reactiveIfThen (mapUnit2 reactiveEqual (bindUnit Situation:container dragStartSit) dragEndSit) 1 3),
	
	
	globalScale = state(Unit Number, 1),
	globalTranslateX = state(Unit Number, 0),
	globalTranslateY = state(Unit Number, 0),
	
	
	// x and y represent, in global coordinates, the center of where the situation should be drawn
	// scale represents, in global coordinates, the radius of the circle or image that represents the situation
	// focus is the situation to be drawn
	drawSituation = template (x::Unit Number, y::Unit Number, scale::Unit Number, focus::Situation, dragHandler::XMLP) {
		children = state(Map Situation ChildProp),
		imBeingDragged = bindUnit (reactiveEqual focus) dragStartSit,
		imBeingDraggedClass = reactiveIfThen imBeingDragged "gsv-dragStart " "",
		imBeingOffset = reactiveAnd (bindUnit (reactiveEqual 1) dragOperation) imBeingDragged,
		imBeingOffsetClass = reactiveIfThen imBeingOffset "gsv-offsetting " "",
		finalClass = mapUnit2 concat imBeingDraggedClass imBeingOffsetClass,
		
		<svg:g class="{finalClass}">
			
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
				<svg:circle class="gsv-hit-inner" r="{scale}" cx="{x}" cy="{y}" shape-rendering="optimizeSpeed">
					<f:on mouseover>add(dragEndInside, null)</f:on>
				</svg:circle>
				<svg:g>
					<f:on mouseover>add(dragEndSit, focus)</f:on>
					<f:call>dragHandler</f:call>
					<svg:circle class="gsv-icon" r="{scale}" cx="{x}" cy="{y}" shape-rendering="optimizeSpeed" />
					<svg:circle class="gsv-hit-object" r="{scale}" cx="{x}" cy="{y}" shape-rendering="optimizeSpeed">
						<f:on mouseout>remove(dragEndInside)</f:on>
					</svg:circle>
					<svg:text x="{x}" y="{mapUnit2 subtract y scale}" text-anchor="middle" shape-rendering="optimizeSpeed">
						{scale}
					</svg:text>
				</svg:g>
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
			// dragHandler = dragdrop dragX dragY onDrop,
			
			dragHandler = <f:call>
				dragging = state(Unit Null),
				offsetX = state(Unit Number),
				offsetY = state(Unit Number),
				<f:wrapper>
					<f:on dragstart>
						add(dragStartSit, child),
						add(offsetX, event.mouseX),
						add(offsetY, event.mouseY),
						add(dragging, null)
					</f:on>
					<f:each dragging as _>
						<f:wrapper>
							<f:each offsetX as offsetX><f:each offsetY as offsetY>
								<f:on globalmousemove>
									add(dragX, subtract event.mouseX offsetX),
									add(dragY, subtract event.mouseY offsetY)
								</f:on>
							</f:each></f:each>
							<f:on globalmouseup>
								onDrop,
								
								remove(dragging),
								remove(dragX),
								remove(dragY),
								remove(offsetX),
								remove(offsetY),
								remove(dragStartSit)
							</f:on>
						</f:wrapper>
					</f:each>
				</f:wrapper>
			</f:call>,
			
			<f:wrapper>
				<f:call>drawSituation childAbsX childAbsY childScale child dragHandler</f:call>
				<svg:circle class="dragCircle" style-display="{reactiveDisplay dragX}" r="{childScale}" cx="{relToAbsX draggedToX}" cy="{relToAbsY draggedToY}" pointer-events="none" />
			</f:wrapper>
		</f:each>
	},
	
	globalClass = reactiveIfThen dragStartSit "gsv-dragging" "gsv-nodrag",
	
	<svg:svg style-width="{width}" style-height="{height}" class="{globalClass}">
		<svg:g transform="{mapUnit2 makeTranslate (mapUnit2 plus (mapUnit (swap divide 2) width) globalTranslateX) (mapUnit2 plus (mapUnit (swap divide 2) height) globalTranslateY)}">
			<f:call>
				drawSituationChildren (returnUnit 0) (returnUnit 0) (mapUnit2 multiply globalScale (mapUnit (swap divide 2) height)) children
			</f:call>
		</svg:g>
		
		<f:call>mouseScrollAction</f:call>
	</svg:svg>
}