template (stringContainer::Unit String) {
	toggle = state(Unit Null),
	stringOrEmpty = defaultValue "empty" stringContainer,
	if toggle as x {
		<input value="{stringContainer}" focus="true">
			<f:on change>
				setName stringContainer event.value,
				unset toggle
			</f:on>
			<f:on blur>
				unset toggle
			</f:on>
		</input>
	} else {
		<f:wrapper>
			{stringOrEmpty}
			<f:on click>
				set toggle null
			</f:on>
		</f:wrapper>
	}
}