template () {
	
	// theNum = TestClass:num TestObject1,
	stringSet = returnUnitSet (TestClass:str TestObject1),
	str = TestClass:str TestObject1,
	
	<div>
		// Hello, theNum2: {theNum} 
		<f:each stringSet as string>
			<div>
				string: {string}
			</div>
		</f:each>
		str: {str}
	</div>
}