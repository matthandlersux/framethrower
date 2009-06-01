//width, height are the bounds imposed by the parent
template (focus::Object, top::Number, left::Number, width::Number, height::Number) {
	pos = state{
		thePosition = create(SV.shape, {focus: focus}),
		randomLocation thePosition width height,
		thePosition,
	},
	
	<f:wrapper>
		//add case statement here
		<f:on init>add(allPositions, pos)</f:on>
			<f:call>
				content = if isSituation focus as _ {
					<f:call>drawSituation focus pos</f:call>
				} else if isInfon focus as _ {
					asCons = (Object~Cons focus),
					<f:each asCons as asCons>
						<f:call>drawInfon asCons pos</f:call>
					</f:each>
				} else {
					<f:call>drawObject focus pos</f:call>
				},				
				<f:wrapper>
					<f:call>content</f:call>
				</f:wrapper>
			</f:call>
	</f:wrapper>
}