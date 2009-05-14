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
	
	down = UI.ui:mouseDown ui.ui2,
	
	<div style-position="absolute" style-left="{UI.ui:mouseX ui.ui}" style-top="{UI.ui:mouseY ui.ui}">
		<f:on click>startDrag</f:on>
		<f:each dragging as _>
			<div>blah</div>
			// <f:on trigger="UI.ui:mouseX ui.ui" as="mouseX">
			// 	add(currentPosX, mouseX)
			// </f:on>
			// <f:on trigger="UI.ui:mouseY ui.ui" as="mouseY">
			// 	add(currentPosY, mouseY)
			// </f:on>
			// <f:on trigger="reactiveNot UI.ui:mouseDown ui.ui">stopDrag</f:on>
		</f:each>
		Draggin {UI.ui:mouseX ui.ui} {UI.ui:mouseY ui.ui}
		
		// <f:each UI.ui:mouseDown ui.ui as _>
		<f:each down as _>
			<div>Get down!</div>
		</f:each>
	</div>
}