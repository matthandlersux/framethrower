template () {
	
	//shouldBeTheSame = myTest,
	
	myTestS = state(Unit Number, 500),
	myTest = fetch myTestS,
	
	shouldBeTheSame = myTest,
	
	<div>
		shouldBeTheSame: {shouldBeTheSame}
	</div>
}