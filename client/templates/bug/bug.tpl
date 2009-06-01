template () {
	dragDrop = template (x::Unit Number) {
		offsetX = state(Unit Number),
		dragging = state(Unit Null),
		<f:wrapper>
			<f:each x as x>
				<f:on mousedown>
					add(offsetX, subtract event.mouseX x),			
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
					<f:trigger reactiveNot (UI.ui:mouseDown ui.ui) as _>
						remove(offsetX),
						remove(dragging)
					</f:trigger>
				</f:wrapper>
			</f:each>
		</f:wrapper>
	},
	x = state{x = create(Unit Number), add(x,50), x},
	<f:each x as myx>
		<div style="position:absolute" style-left="{myx}">
			Hey
			<f:call>dragDrop x</f:call>
		</div>
	</f:each>
}