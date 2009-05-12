template () {
	myset = state(Set Number),
	randomNumber = function (n) {
		return Math.round(Math.random() * n);
	},
	addToSet = action () {
		r = randomNumber 500,
		add(myset, r)
		// add(myset, randomNumber 500)
	},
	<div>
		<div>The set: {myset}</div>
		<div>
			<f:on event="click">addToSet</f:on>
			Add a number to the set
		</div>
	</div>
}