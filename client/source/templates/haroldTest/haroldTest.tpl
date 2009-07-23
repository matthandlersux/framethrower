template() {
	s = state(Unit Number, 1),
	t = state(Unit (Unit Number), s),
	a = fetch s,
	b = fetch t,
	c = fetch b,
	u = unfetch (plus a c),
	
	<f:wrapper>
		<f:on mousedown>
			add(s, plus a (subtract (fetch u) c))
		</f:on>
		<f:each b as x>
			<f:each u as y>
				<div>{x} {y}</div>
			</f:each>
		</f:each>
		<f:call>test1 a</f:call>
		<f:call>test1 (plus 1 a)</f:call>
		{s}
		{t}
		{u}
	</f:wrapper>
}
