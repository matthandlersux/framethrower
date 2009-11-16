template () {
	
	localCell1 = state {
		cell <- create(Unit String),
		set cell "andrew",
		return cell
	},

	localCell2 = state {
		cell <- create(Unit String),
		return cell
	},

	toggle = state(Unit Null),
	
	<div>

		<f:call>
			inputfield localCell1
		</f:call>
		
		<br />
		<f:call>
			inputfield localCell2
		</f:call>
		
		
	</div>
}