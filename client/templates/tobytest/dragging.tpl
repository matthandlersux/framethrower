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
	
	<div style-position="absolute" style-left="{UI.ui:mouseX ui.ui}" style-top="{UI.ui:mouseY ui.ui}">
		<f:on event="click">startDrag</f:on>
		<f:each select="dragging" key="blah">
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
	</div>
}