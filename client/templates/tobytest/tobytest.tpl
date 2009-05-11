template () {
	test = 88,
	myTemplate = template (x::Number) {
		<div>Here's another template that has access to scope, see: {test} , and here's a parameter: {x}</div>
	},
	jsfun = function (x::Number) {
		
		return x + 99;
	},
	
	
	<div testatt="{test}">
		Hello World.
		<div>
			Set test: {testCell}
		</div>
		<f:each select="testCell" key="entry">
			<div>An entry: {entry}</div>
		</f:each>
		<f:call>myTemplate (jsfun 9999)</f:call>
		
		<div>
			<f:call>counter</f:call>
		</div>
		
	</div>
}