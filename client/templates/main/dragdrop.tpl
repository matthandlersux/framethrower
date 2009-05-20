template (content::XMLP, x::Unit Number, y::Unit Number) {
	offsetX = state(Unit Number),
	offsetY = state(Unit Number),
	dragging = state(Unit Null),
	someXML = if dragdrop 6 as drg {
		title = "6 it is:",
		<div>
			{title} {drg}
		</div>
	} else if dragdrop 7 as drg {
		<div>
			Not this time either
		</div>
	} else {
		<div>
			Whats up?
		</div>
	},
	<div style-position="absolute" style-left="{x}" style-top="{y}">
		<f:on mousedown>
			add(dragging, null)
		</f:on>
		<f:each dragging as _>
			<span>
				<f:trigger UI.ui:mouseX ui.ui as mouseX>
					add(x, mouseX)
				</f:trigger>
				<f:trigger UI.ui:mouseY ui.ui as mouseY>
					add(y, mouseY)
				</f:trigger>
				<f:trigger reactiveNot (UI.ui:mouseDown ui.ui) as _>
					remove(dragging)
				</f:trigger>
			</span>
		</f:each>
		<f:call>content</f:call>
	</div>
}