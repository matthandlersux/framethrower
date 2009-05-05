template (set::Set Object) {
	putObjectInSituation = action(object::Object, situation::Object) {
		in = shared.in,
		infon = makeInfon2 in situation object,
		truth = Cons::truth infon,
		add(truth, null)
	},
	
	makeTrueInOnt = action(infon::Cons) {
		ont = shared.ont,
		putObjectInSituation infon ont
	},	
	
	makeCons = action(left::Object, right::Object) {
		cons = create(Cons, {left:left, right:right}),
		upRight = Object::upRight left,
		upLeft = Object::upLeft right,
		add(upRight, cons),
		add(upLeft, cons),
		//return cons
		cons
	},	
	
	makeInfon2 = action(relation::Object, arg1::Object, arg2::Object) {
		cons1 = makeCons relation arg1,
		//return the second cons
		makeCons cons1 arg2
	},
	
	makeOntProperty = action(relation::Object, arg1::Object, arg2::Object) {
		infon = makeInfon2 relation arg1 arg2,
		makeTrueInOnt infon
	},
	
	nameObject = action(object::Object, name::String) {
		nameRel = shared.name,
		nameText = create(X.text, {string:name}),
		makeOntProperty nameRel object nameText
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

	<div>
		Click Here to perform action
		<f:each select="set" key="key">
			<f:on event="click">
				changeName key message
			</f:on>
		</f:each>
	</div>
}