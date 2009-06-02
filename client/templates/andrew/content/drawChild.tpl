//width, height are the bounds imposed by the parent
template (focus::Object, widthBound::Number, heightBound::Number, globalTop::Unit Number, globalLeft::Unit Number) {
	pos = state{
		thePosition = create(SV.shape, {focus: focus}),
		randomLocation thePosition widthBound heightBound,
		thePosition,
	},
	width = SV.shape:width pos,
	height = SV.shape:height pos,
	left = SV.shape:left pos,
	top = SV.shape:top pos,
	
	totalTop = testMapUnit2 plus globalTop top,
	totalLeft = testMapUnit2 plus globalLeft left,
	
	globalPos = state{
		create(SV.shape, {focus: focus, left:totalLeft, top:totalTop, width:width, height:height})
	},
	
	<f:wrapper>
		//add case statement here
		<f:on init>add(allPositions, globalPos)</f:on>
		<f:call>
			content = if isSituation focus as _ {
				<f:call>drawSituation focus width height totalTop totalLeft</f:call>
			} else if isInfon focus as _ {
				asCons = (Object~Cons focus),
				<f:each asCons as asCons>
					<f:call>drawInfon asCons width height</f:call>
				</f:each>
			} else {
				<f:call>drawObject focus width height</f:call>
			},				
			<f:wrapper>
				<f:call>dragdropSVG content left top</f:call>
			</f:wrapper>
		</f:call>
	</f:wrapper>
}