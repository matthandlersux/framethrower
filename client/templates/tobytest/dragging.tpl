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
		<f:on event="click">startDrag</f:on>
		<f:each select="dragging" key="_">
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
		
		// <f:each select="UI.ui:mouseDown ui.ui" key="_">
		<f:each select="down" key="_">
			<div>Get down!</div>
		</f:each>
	</div>
}