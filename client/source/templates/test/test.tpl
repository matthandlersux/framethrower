template () {
	
	blah = plus 4 5,
	myset = state(Set Number),
	
	<div>
		hello world. {blah} {myset}
		<f:on click>
			add(myset, 888)
		</f:on>
		<div>
			<f:each myset as entry>
				<div>{entry}</div>
			</f:each>
		</div>
	</div>
}