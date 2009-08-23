template () {
	a = 10,
	z = state(Unit Number, 100),
	// z = state {x<-create(Unit Number), add(x,100), return x},
	c = fetch z,
	getSet = action(x::Number)::Set Number {
		make = create(Set Number),
		s <- make,
		b = plus a c,
		add s b,
		remove s x,
		return s
	},
	copySet = action(s::Set Number)::Set Number {
		t <- create(Set Number),
		extract s as x {
			add t x
		},
		return t
	},
	tpl = template(n::Number) {
		<div>{n}</div>
	},
	s = state {getSet 2},
	t = state {getSet 3},
	u = state(Set Number),
	
	<div>
		<f:on init>
			s <- getSet 4,
			// x <- extract s,
			extract s as x {
				add u x
			}
		</f:on>
		<f:on mousedown>
			s <- copySet u,
			extract s as x {
				y = plus a x,
				add u y
			}
		</f:on>
		
		{s}
		{t}
		{u}
		{c}
		<f:call>tpl c</f:call>
	</div>
}