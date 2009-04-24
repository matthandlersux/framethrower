template (a::Number) {
	// this is a JSFUNC:
	jsfun = function (a::Number)::Number {
		return a + 10;
	},
	result = jsfun a,
	<f:wrapper>
		{result}
	</f:wrapper>
}