template (init::Unit Number, setValue::Number -> Number -> Action a) {
	dragStart = state(Unit Number),
	startS = state(Unit Number),
	<f:wrapper>
		blah
		{init}
		<f:on mousedown>
			jsaction ()::Void {
				console.log("mousedown activated");
			},
			extract init as i {
				jsaction ()::Void {
					console.log("this is even being called");
				},
				set dragStart event.mouseX,
				set startS i
			}
		</f:on>
		<f:each dragStart as from>
			start = fetch startS,
			<f:wrapper>
				dragging
				<f:on globalmouseup>
					unset dragStart
				</f:on>
				<f:on globalmousemove>
					setValue start (subtract event.mouseX from)
				</f:on>
			</f:wrapper>
		</f:each>
	</f:wrapper>
}

