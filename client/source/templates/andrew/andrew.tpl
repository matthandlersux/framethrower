template () {
	
	localCell1 = state {
		cell <- create(Unit String),
		set cell "andrew",
		// add cell "harold",
		// add cell "toby",
		// add cell "matt",
		return cell
	},

	localCell2 = state {
		cell <- create(Unit Null),
		// add cell "andrew",
		// add cell "harold",
		// add cell "toby",
		// add cell "matt",
		return cell
	},

	
	// begin = state(Unit String, "c"),
	// end = state(Unit String, "n"),
	
	// localRanged = rangeByKey begin end localCell,
	
	defaultValueCell = defaultValue "joe" localCell1,
	
	<div>
		// <div>
		// 	Click here to change string
		// 	<f:on click>
		// 		newString <- changeString "testString 1",
		// 		newString2 <- changeString2 "testString 2",
		// 		add localCell newString2
		// 	</f:on>
		// </div>
	
		// <f:each TestCell as TestObject>
		// 	<div>
		// 		string: {TestClass:str TestObject}
		// 		<br />
		// 		<br />
		// 	</div>
		// </f:each>
		
		
		// <f:call>
		// 	inputfield localCell
		// </f:call>
		
		<br />
		// Local Cell: {localCell}
		
		
		LocalCell1:
		<f:each localCell1 as element>
			<div>
				<b>{element}</b>
				<div style="display:inline; padding-left:10">
					<i>Click to Remove</i>
					<f:on click>
						unset localCell1
					</f:on>
				</div>
			</div>
		</f:each>
		<div style="display:inline; padding-left:10">
			<i>Click to Add Toby</i>
			<f:on click>
				set localCell1 "Toby"
			</f:on>
		</div>
		
		<br />
		LocalCell2:
		<f:each localCell2 as element>
			<div>
				<b>{element}</b>
				<div style="display:inline; padding-left:10">
					<i>Click to Remove</i>
					<f:on click>
						unset localCell2
					</f:on>
				</div>
			</div>
		</f:each>
		<div style="display:inline; padding-left:10">
			<i>Click to Add Null</i>
			<f:on click>
				set localCell2 null
			</f:on>
		</div>
		
		
		<br />
		Default Value: {defaultValueCell}
		
		
		
	</div>
}