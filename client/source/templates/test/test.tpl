template () {
	myT = template () {
		counter = state(Unit Number, 0),
		<div>
			{counter}
			<f:on click>
				set counter (plus 1 (fetch counter))
			</f:on>
		</div>
	},
	
	<div>
		<f:call>myT</f:call>
		<f:call>myT</f:call>
	</div>
}