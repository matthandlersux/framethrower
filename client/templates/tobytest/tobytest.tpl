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
		<f:each testCell as entry>
			<div>An entry: {entry}</div>
		</f:each>
		<f:call>myTemplate (jsfun 9999)</f:call>
		
		<hr />
		
		<div>
			<f:call>counter</f:call>
		</div>
		
		<hr />
		
		<div>
			<f:call>set</f:call>
		</div>
		
		<hr />
		
		<div>
			<f:call>dragging</f:call>
		</div>
		
	</div>
}