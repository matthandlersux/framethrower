template () {
	
	localCell = state {
		cell <- create(Set String),
		add cell "andrew",
		add cell "harold",
		add cell "toby",
		add cell "matt",
		return cell
	},
	
	begin = state(Unit String, "c"),
	end = state(Unit String, "n"),
	
	localRanged = rangeByKey begin end localCell,
	
	<div>
		<div>
			Click here to change string
			<f:on click>
				newString <- changeString "testString 1",
				newString2 <- changeString2 "testString 2",
				add localCell newString2
			</f:on>
		</div>
	
		<f:each TestCell as TestObject>
			<div>
				string: {TestClass:str TestObject}
				<br />
				<br />
			</div>
		</f:each>
		
		
		// <f:call>
		// 	inputfield localCell
		// </f:call>
		
		<br />
		// Local Cell: {localCell}
		
		
		LocalRanged:
		<f:each localRanged as element>
			<div>
				{element},
			</div>
		</f:each>
		
	</div>
}