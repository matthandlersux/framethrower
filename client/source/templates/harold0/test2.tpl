template() {
	s = state(Unit Number, 1),
	t = state(Unit Number),
	x = fetch s,
	y = plus (fetch s) (fetch s),
	z = fetch (mapUnit2 plus s s),
	a = 100,
	
	<div>
		<f:on mousedown>
			x = extract s,
			add(s, plus x 1)
		</f:on>
		
		<f:trigger a as x>
			add(t, x)
		</f:trigger>
		
		<f:each a as a>
			{a}
		</f:each>
		
		{x}
		{y}
		{plus x y}
		{plus y z}
		{t}
	</div>
}