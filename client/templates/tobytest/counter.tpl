template () {
	
	counterValue = state(Unit Number),
	
	changeState = action(newValue::Number) {
		add(counterValue, newValue)
	},
	
	<div testatt="{test}">
		<f:on event="init">
			changeState 100
		</f:on>
		<div>
			Counter value: {counterValue}
		</div>
		<div>
			<f:on event="click">
				changeState 0
			</f:on>
			Reset Counter
		</div>
		<div>
			<f:each select="counterValue" key="currentState">
				
				<f:on event="click">
					changeState (plus currentState 1)
				</f:on>
			</f:each>
			Increment Counter
		</div>
	</div>
}