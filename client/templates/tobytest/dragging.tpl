template () {
	dragging = state(Unit Null),
	startDrag = action () {
		add(dragging, null)
	},
	stopDrag = action () {
		remove(dragging)
	},
	<div>
		Draggin {UI.ui:mouseX ui.ui} {UI.ui:mouseY ui.ui}
	</div>
}