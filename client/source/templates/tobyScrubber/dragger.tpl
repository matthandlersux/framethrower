template (init::Unit Number, setValue::Number -> Number -> Number -> Action a) {
	dragX = state(Unit Number),
	dragY = state(Unit Number),
	initS = state(Unit Number),
	<f:wrapper>
		<f:on mousedown>
			set initS (fetch init),
			set dragX event.mouseX,
			set dragY event.mouseY
		</f:on>
		<f:each dragX as _>
			initValue = fetch initS,
			x = fetch dragX,
			y = fetch dragY,
			<f:wrapper>
				<f:on globalmouseup>
					unset initS,
					unset dragX,
					unset dragY
				</f:on>
				<f:on globalmousemove>
					setValue initValue (subtract event.mouseX x) (subtract event.mouseY y)
				</f:on>
			</f:wrapper>
		</f:each>
	</f:wrapper>
}