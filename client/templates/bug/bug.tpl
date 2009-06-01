template () {
	dragDrop = template (x::Unit Null) {
		dragging = state(Unit Null),
		<f:wrapper>
			<f:on mousedown>
				add(dragging, null)
			</f:on>
			<f:each dragging as _>
				<f:wrapper>
					<div>this disappears!</div>
					<f:trigger UI.ui:mouseX ui.ui as mouseX>
						add(x, null)
					</f:trigger>
					<f:trigger reactiveNot (UI.ui:mouseDown ui.ui) as _>
						remove(dragging)
					</f:trigger>
				</f:wrapper>
			</f:each>
		</f:wrapper>
	},
	x = state{x = create(Unit Null), add(x,null), x},
	<f:each x as myx>
		<div style="position:absolute" style-left="50">
			Hey
			<f:call>dragDrop x</f:call>
		</div>
	</f:each>
}