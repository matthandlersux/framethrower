template () {
	myset = state(Set Number),
	randomNumber = function (n) {
		return Math.round(Math.random() * n);
	},
	addToSet = action (n) {
		add(myset, n)
	},
	<div>
		<div>The set: {myset}</div>
		<div>
			<f:on click>addToSet 30</f:on>
			Add a number to the set
		</div>
		<div>
			<f:on click>addToSet 22</f:on>
			Add a different number
		</div>
	</div>
}