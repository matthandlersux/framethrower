template (dragX::Unit Number, dragY::Unit Number, onDrop::Number -> Number -> Action) {
	offsetX = state(Unit Number),
	offsetY = state(Unit Number),
	dragging = state(Unit Null),
		
	//for now, just draw it
	<f:wrapper>
		<f:on mousedown>
			add(offsetX, event.mouseX),
			add(dragging, null)
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
					<f:each dragX as finalX><f:each dragY as finalY>
						<f:on init>
							onDrop finalX finalY,
							remove(dragX),
							remove(dragY),
							remove(offsetX),
							remove(offsetY),
							remove(dragging)
						</f:on>
					</f:each></f:each>
				</f:each>
			</f:wrapper>
		</f:each>
	</f:wrapper>
}