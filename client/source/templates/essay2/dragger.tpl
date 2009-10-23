// template (init::Unit Number, setValue::Number -> Number -> Number -> Action a) {
// 	dragX = state(Unit Number),
// 	dragY = state(Unit Number),
// 	initS = state(Unit Number),
// 	<f:wrapper>
// 		<f:on mousedown>
// 			set initS (fetch init),
// 			set dragX event.mouseX,
// 			set dragY event.mouseY
// 		</f:on>
// 		<f:each dragX as _>
// 			initValue = fetch initS,
// 			x = fetch dragX,
// 			y = fetch dragY,
// 			<f:wrapper>
// 				<f:on globalmouseup>
// 					unset initS,
// 					unset dragX,
// 					unset dragY
// 				</f:on>
// 				<f:on globalmousemove>
// 					setValue initValue (subtract event.mouseX x) (subtract event.mouseY y)
// 				</f:on>
// 			</f:wrapper>
// 		</f:each>
// 	</f:wrapper>
// }


template (init::Unit Number, setValue::Number -> Number -> Action a) {
	dragStart = state(Unit Number),
	startS = state(Unit Number),
	<f:wrapper>
		blah
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
				dir
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

