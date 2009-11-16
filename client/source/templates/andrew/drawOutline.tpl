template (node::OutlineNode) {
	children = OutlineNode:children node,
	childrenSize = length children,
	toggle = state(Unit Null),
	buttonText = reactiveIfThen toggle "-" "+",
	toggleAction = action (toggle::Unit Null) {
		if toggle as _{
			unset toggle
		} else {
			set toggle null
		}
	},

	<div class="outlineNode">
		<div class="toggle">
			<div class="button">
				{buttonText}
				<f:on click>toggleAction toggle</f:on>
			</div>
			<f:call>
				inputfield (OutlineNode:string node)
			</f:call>
			<div class="childrenSize">
				({childrenSize})
			</div>
			<div class="light">
				<i>Add Child</i>
				<f:on click>
					addNewChild children
				</f:on>
			</div>
		</div>
		
		<f:each toggle as _>
			<f:each children as child>
				drawOutline child
			</f:each>
		</f:each>
	</div>
}