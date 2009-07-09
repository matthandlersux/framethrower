template() {
	s = state(Unit Number, 1),
	x = fetch s,
	y = plus (fetch s) (fetch s),
	z = fetch (mapUnit2 plus s s),
	
	<div>
		<f:on mousedown>
			x = extract s,
			add(s, plus x 1)
		</f:on>
		
		{x}
		{y}
		{plus x y}
		{plus y z}
	</div>
}