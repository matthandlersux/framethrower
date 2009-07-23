template () {
	sit1 = state(Situation),
	sit2 = state(Situation),
	
	mySet = state {
		mySet = create(Set Situation),
		add(mySet, sit1),
		add(mySet, sit2),
		mySet
	},
	
	
	mySet2 = state {
		mySet2 = create(Set Number),
		add(mySet2, 5),
		add(mySet2, 10),
		add(mySet2, 15),
		mySet2
	},
	
	essay = "hi
	there",
	
	
	<div>
		Essay: {essay}<br />
		Should be 0: {getPosition sit1 mySet}<br />
		Should be 1: {getPosition sit2 mySet}<br />
		Should be 0: {getPosition 5 mySet2}<br />
		Should be 1: {getPosition 10 mySet2}<br />
		Should be 2: {getPosition 15 mySet2}<br />
		
		<br /><br /><br /><br /><br /><br />
		
		<div>
			<f:each mySet2 as entry>
				<div>
					Member: {entry}, Position: {getPosition entry mySet2}
				</div>
			</f:each>
		</div>
		
		<div>
			Click here 20
			<f:on click>
				add(mySet2, 20)
			</f:on>
		</div>
		<div>
			Click here 9
			<f:on click>
				add(mySet2, 9)
			</f:on>
		</div>
		<div>
			Click here 7
			<f:on click>
				add(mySet2, 7)
			</f:on>
		</div>
		<div>
			Click here 15
			<f:on click>
				add(mySet2, 15)
			</f:on>
		</div>
		<div>
			Click here 1
			<f:on click>
				add(mySet2, 1)
			</f:on>
		</div>
	</div>
}