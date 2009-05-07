template () {
	test = 88,
	myTemplate = template (x::Number) {
		<div>Here's another template that has access to scope, see: {test} , and here's a parameter: {x}</div>
	},
	jsfun = function (x::Number) {
		return x + 99;
	},
	stateTest = state(Set Number),
	actionTest = action() {
		ob = create(Object, {}),
		ob
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
			State test: {stateTest}
		</div>
		<div>
			Action test: {actionTest}
		</div>
	</div>
}