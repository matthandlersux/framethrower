template () {
	

	
	
	
	
	
	
	// mainSit = state {
	// 	tester = makeSituationNamed "tester",
	// 	child = makeSituationNamedIn "child" tester,
	// 	tester
	// },
	
	
	situations = state {
		situations = create(Set Situation),
		add(situations, universe),
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
	
	situationsCount = length situations,
	divide = function (x::Number, y::Number) {
		return x / y;
	},
	width = mapUnit2 divide (UI.ui:screenWidth ui.ui) situationsCount,
	
	<div style-width="{UI.ui:screenWidth ui.ui}" style-height="{UI.ui:screenHeight ui.ui}">
		<f:each situations as sit>
			
			<div style-position="absolute" style-width="{width}" style-left="{mapUnit2 multiply (getPosition sit situations) width}" style-overflow="auto" style-height="{UI.ui:screenHeight ui.ui}" style-borderRight="1px solid #999">
				<div style-color="red">
					<f:on click>remove(situations, sit)</f:on>
					(Close)
				</div>
				<f:call>viewSituation sit</f:call>
			</div>
		</f:each>
	</div>
}