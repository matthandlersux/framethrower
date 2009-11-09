template () {
	
	// theNum = TestClass:num TestObject1,
	stringSet = returnUnitSet (TestClass:str TestObject1),
	str = TestClass:str TestObject1,
	
	<div>
		<f:each TestCell as TestObject>
			<div>
				string: {TestClass:str TestObject}
				<br />
				<br />
			</div>
		</f:each>
	</div>
}