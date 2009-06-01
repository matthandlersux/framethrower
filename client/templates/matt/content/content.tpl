template () {
	boxes = state{
		b = create(Set Number),
		add(b, 1),
		add(b, 2),
		add(b, 3),
		b
	},
	<f:each boxes as box>
		<div>box {box}</div>
	</f:each>
}