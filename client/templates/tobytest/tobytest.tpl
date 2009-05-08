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
		add(testCell, 9999),
		create(Object, {})
	},
	
	
	
	myAction = action() {
		putObjectInSituation = action(object::Object, situation::Object) {
			in = shared.in,
			infon = makeInfon2 in situation object,
			truth = Cons:truth infon,
			add(truth, null)
		},

		makeTrueInOnt = action(infon::Cons) {
			ont = shared.ont,
			putObjectInSituation (Cons~Object infon) ont
		},	

		makeCons = action(left::Object, right::Object) {
			cons = create(Cons, {left:left, right:right}),
			upRight = Object:upRight left,
			upLeft = Object:upLeft right,
			add(upRight, cons),
			add(upLeft, cons),
			//return cons
			cons
		},	

		makeInfon2 = action(relation::Object, arg1::Object, arg2::Object) {
			cons1 = makeCons relation arg1,
			//return the second cons
			makeCons (Cons~Object cons1) arg2
		},

		makeOntProperty = action(relation::Object, arg1::Object, arg2::Object) {
			infon = makeInfon2 relation arg1 arg2,
			makeTrueInOnt infon
		},

		nameObject = action(object::Object, name::String) {
			nameRel = shared.name,
			nameText = create(X.text, {string:name}),
			makeOntProperty nameRel object (X.text~Object nameText)
		},

		changeName = action(focus::Object, newName::String) {
			// ontInfons = flattenSetUnit ((mapSet (compose getObjectInOnt Cons~Object)) (getOntInfons shared.name focus)),
			// removeAction = action(infon::Cons) {
			// 	truth = Cons::truth infon,
			// 	remove(truth, null)
			// },
			//foreach was here?
			//map removeAction ontInfons,
			//if statement was here?
			//<xsl:if test="string-length($newName/@value) &gt; 0">
			nameObject focus newName
		},

		message = "This is a new name",

		changeName shared.realLife message
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
			<f:on event="click">myAction</f:on>
			Action test
		</div>
	</div>
}