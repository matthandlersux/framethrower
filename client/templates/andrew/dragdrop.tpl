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
				<f:each offsetX as offsetX>
					<f:trigger UI.ui:mouseX ui.ui as mouseX>
						add(dragX, subtract mouseX offsetX)
					</f:trigger>
				</f:each>
				<f:each offsetY as offsetY>
					<f:trigger UI.ui:mouseY ui.ui as mouseY>
						add(dragY, subtract mouseY offsetY)
					</f:trigger>
				</f:each>
				<f:each reactiveNot (UI.ui:mouseDown ui.ui) as _>
					<f:on init>
						extract dragX as finalX {
							extract dragY as finalY {
								onDrop finalX finalY
							}
						}
					</f:on>
				</f:each>
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