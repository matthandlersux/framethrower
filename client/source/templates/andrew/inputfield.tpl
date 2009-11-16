template (stringContainer::Unit String) {
	toggle = state(Unit Null),
	myAct = jsaction() {
		document.getElementById('andrewtest').focus();
	},
	if toggle as x {
		<input value="{stringContainer}" id="andrewtest">
			<f:on init>
				myAct
			</f:on>
			<f:on change>
				set stringContainer event.value,
				unset toggle
			</f:on>
			<f:on blur>
				unset toggle
			</f:on>
		</input>
	} else {
		<div>
			{stringContainer}
			<f:on click>
				set toggle null
			</f:on>
		</div>
	}
}