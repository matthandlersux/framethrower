template () {
	
	counterValue = state(Unit Number),
	
	changeState = action(newValue::Number) {
		add(counterValue, newValue)
	},
	
	<div testatt="{test}">
		<f:on init>
			changeState 100
		</f:on>
		<div>
			Counter value: {counterValue}
		</div>
		<div>
			<f:on click>
				changeState 0
			</f:on>
			Reset Counter
		</div>
		<div>
			<f:each counterValue as currentState>
				<f:on click>
					changeState (plus currentState 1)
				</f:on>
			</f:each>
			Increment Counter
		</div>
	</div>
}