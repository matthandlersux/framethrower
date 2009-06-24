template (dragX::Unit Number, dragY::Unit Number, onDrop::Action) {
	offsetX = state(Unit Number),
	offsetY = state(Unit Number),
	dragging = state(Unit Null),
	
	<f:wrapper>
		<f:on dragstart>
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
					remove(offsetY)
					
				</f:on>
			</f:wrapper>
		</f:each>
	</f:wrapper>
}