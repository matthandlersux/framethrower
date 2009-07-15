template() {
	s = state(Unit Number, 1),
	
	<f:wrapper>
		<f:on mousedown>
			x = extract s,
			add(s, plus x 1)
		</f:on>
		{s}
	</f:wrapper>
}