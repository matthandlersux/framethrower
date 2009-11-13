template () {
	playTime = state(Unit Number),
	play = state(Unit Null),
	
	<div>
		<div>
			<f:call>flashVideo 400 300 "moulinRouge" playTime play</f:call>
		</div>
	
		<div>
			skip
			<f:on click>
				set playTime 300
			</f:on>
		</div>
		
		<div>
			play
			<f:on click>set play null</f:on>
		</div>
		<div>
			pause
			<f:on click>unset play</f:on>
		</div>
	</div>
}