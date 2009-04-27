template () {
	// this is a JSFUNC:
	jsfun = function (a::Number)::Number {
		return a * 2;
	},
	result = jsfun 5,

	<div>
		<f:each select="testCell" key="entry">
			<div>Text Here</div>
		</f:each>
	</div>
}