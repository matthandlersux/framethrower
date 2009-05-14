template () {
	dragging = state(Unit Null),
	startDrag = action () {
		add(dragging, null)
	},
	stopDrag = action () {
		remove(dragging)
	},
	currentPosX = state(Unit Number),
	currentPosY = state(Unit Number),
	
	down = UI.ui:mouseDown ui.ui,
	
	<div style-position="absolute" style-left="{UI.ui:mouseX ui.ui}" style-top="{UI.ui:mouseY ui.ui}">
		<f:on mousedown>startDrag</f:on>
		<f:each dragging as _>
			<div>
				blah
				<f:trigger UI.ui:mouseX ui.ui as mouseX>
					add(currentPosX, mouseX)
				</f:trigger>
				<f:trigger UI.ui:mouseY ui.ui as mouseY>
					add(currentPosY, mouseY)
				</f:trigger>
				<f:trigger reactiveNot (UI.ui:mouseDown ui.ui) as blah>stopDrag</f:trigger>
			</div>
		</f:each>
		Draggin {UI.ui:mouseX ui.ui} {UI.ui:mouseY ui.ui}
		<div>
			current pos: {currentPosX}, {currentPosY}
		</div>
		
		// <f:each UI.ui:mouseDown ui.ui as _>
		<f:each down as _>
			<div>Get down!</div>
		</f:each>
	</div>
}