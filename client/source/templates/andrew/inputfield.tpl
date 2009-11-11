template (stringContainer::Unit String) {
	toggle = state(Unit Null),
	<div><f:call>
		if toggle as x {
			<input>
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
	</f:call></div>
}