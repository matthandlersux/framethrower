template () {
	
	// theNum = TestClass:num TestObject1,
	stringSet = returnUnitSet (TestClass:str TestObject1),
	str = TestClass:str TestObject1,
	localCell = state {
		cell <- create(Unit String),
		set cell "default",
		return cell
	},
	
	<div>
		<div>
			Click here to change string
			<f:on click>
				newString <- changeString "testString 1",
				newString2 <- changeString2 "testString 2",
				set localCell newString2
			</f:on>
		</div>
	
		<f:each TestCell as TestObject>
			<div>
				string: {TestClass:str TestObject}
				<br />
				<br />
			</div>
		</f:each>
		
		<f:call>
			inputfield localCell
		</f:call>
		
		<br />
		Local Cell: {localCell}
	</div>
}