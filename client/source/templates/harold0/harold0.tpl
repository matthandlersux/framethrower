template() {
	s = state(Unit Number, 10),
	x = fetch s,
	
	<f:wrapper>
		<f:call>test1 1</f:call>
		<f:call>test2</f:call>
		{x}
	</f:wrapper>
}