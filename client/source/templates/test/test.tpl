template () {
	//a commen
	blah = plus 4 5,
	myset = state(Set Number),
	s = function (x::Number)::String {
		return "\"hi\nthere\"";
	},
	
	<div>
		hello world. {blah} {myset}
		s: {s 0}
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