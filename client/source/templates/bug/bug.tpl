template () {
	myCell = state {
		n <- create(Set Number),
		add n 5,
		add n 8,
		return n
	},
	
	<div>
		<f:on init>
			extract myCell as n {
				add myCell (plus n 2)
			}
		</f:on>

	
		myCell: {myCell}
	</div>
}