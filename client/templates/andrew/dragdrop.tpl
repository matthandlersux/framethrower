template (dragX::Unit Number, dragY::Unit Number, onDrop::Number -> Number -> Action) {
	offsetX = state(Unit Number),
	offsetY = state(Unit Number),
	dragging = state{d = create(Unit Null), add(d, null), d},
		
	//for now, just draw it
	<f:wrapper>
		<f:on mousedown>
			add(offsetX, event.mouseX),
			add(offsetY, event.mouseY),
			// add(dragging, null)
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
					finalX = extract dragX,
					finalY = extract dragY,
					onDrop finalX finalY
					// extract dragX as finalX {
					// 	extract dragY as finalY {
					// 		onDrop finalX finalY
					// 	}
					// }
				</f:on>
				// <f:trigger reactiveNot (UI.ui:mouseDown ui.ui) as _>
				// 	// remove(dragX),
				// 	// remove(dragY),
				// 	// remove(offsetX),
				// 	// remove(offsetY),
				// 	remove(dragging)
				// </f:trigger>
			</f:wrapper>
		</f:each>
	</f:wrapper>
}