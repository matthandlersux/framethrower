template() {
	s = state(Unit Number, 10),
	y = fetch s,
	
	<f:wrapper>
		<f:call>test1 1</f:call>
		<f:call>test2</f:call>
		{y}
	</f:wrapper>
}