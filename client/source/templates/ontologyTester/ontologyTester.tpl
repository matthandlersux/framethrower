template () {
	mainSit = state {
		tester = makeSituationNamed "tester",
		child = makeSituationNamedIn "child" tester,
		tester
	},
	
	
	situations = state {
		situations = create(Set Situation),
		add(situations, mainSit),
		situations
	},
	
	
	
	
	
	
	
	linkToSit = template (sit::Situation) {
		<span style-color="blue">
			<f:on click>
				add(situations, sit)
			</f:on>
			{Situation:propName sit}
		</span>
	},
	
	<div>
		<f:each situations as sit>
			viewSituation sit
		</f:each>
	</div>
}