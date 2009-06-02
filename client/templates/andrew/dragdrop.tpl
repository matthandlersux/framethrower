template (contain::Unit Number -> Unit Number -> XMLP -> XMLP, content::XMLP, x::Unit Number, y::Unit Number) {
	offsetX = state(Unit Number),
	offsetY = state(Unit Number),
	dragging = state(Unit Null),
	<f:wrapper>
		<f:each x as x>
			<f:on mousedown>
				add(offsetX, subtract event.mouseX x),			
			</f:on>
		</f:each>
		<f:each y as y>
			<f:on mousedown>
				add(offsetY, subtract event.mouseY y),
			</f:on>
		</f:each>
		<f:on mousedown>
			add(dragging, null)
		</f:on>
		<f:each dragging as _>
			<f:wrapper>
				<f:each offsetX as offsetX>
					<f:trigger UI.ui:mouseX ui.ui as mouseX>
						add(x, subtract mouseX offsetX)
					</f:trigger>
				</f:each>
				<f:each offsetY as offsetY>
					<f:trigger UI.ui:mouseY ui.ui as mouseY>
						add(y, subtract mouseY offsetY)
					</f:trigger>
				</f:each>
				<f:trigger reactiveNot (UI.ui:mouseDown ui.ui) as _>
					remove(offsetX),
					remove(offsetY),
					remove(dragging)
				</f:trigger>
			</f:wrapper>
		</f:each>
		<f:call>contain x y content</f:call>
	</f:wrapper>
}