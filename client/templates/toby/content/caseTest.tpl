template () {
	test = state(Unit Number),
	<div>
		<f:call>
			if (test as hello) {
				<div>{hello}</div>
			} else {
				<div>Test has no value</div>
			}
		</f:call>
	</div>
}