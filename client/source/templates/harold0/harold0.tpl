template() {
	s = state(Unit Number, 1),
	t = state(Unit (Unit Number), s),
	a = fetch s,
	b = fetch t,
	c = fetch b,
	d = unfetch (plus (fetch s) (fetch (fetch t))),
	e = unfetch (plus (fetch d) (fetch s)),
	
	<f:wrapper>
		<f:on mousedown>
			x = extract unfetch (plus 1 a),
			add(s, x)
		</f:on>
		<f:each unfetch (plus 3 a) as z>
			<div>
				u={s}
				uu={t}
				fu={a}
				fuu={b}
				ffuu={c}
				{unfetch s}
				{mapUnit0 (mapUnit1 (x -> plus 1 x) s)}
				{plus 2 a}
				{z}
				{d}
				{e}
			</div>
		</f:each>
		{s}
	</f:wrapper>
}
