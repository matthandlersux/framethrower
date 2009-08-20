template () {
	x = 6,
	y = plus x 12,
	z = state {
		z <- create(Set Number),
		add(z, 145),
		return z
	},
	<div>
		hello rte
		<div contentEditable="true" id="super">blah</div>
		{x} {y}
		<br />
		{z}
	</div>	
}