//width, height are the bounds imposed by the parent
template (focus::Object, width::Number, height::Number) {
	pos = state{
		thePosition = create(SV.shape, {focus: focus}),
		randomLocation thePosition width height,
		thePosition
	},
	
	<div>
		//add case statement here
		<f:on init>add(allPositions, pos)</f:on>
		<f:each SV.shape:width pos as mywidth><f:each SV.shape:height pos as myheight>
			<f:call>
				content = if isSituation focus as _ {
					<f:call>drawSituation focus mywidth myheight</f:call>
				} else if isInfon focus as _ {
					<f:call>drawInfon focus mywidth myheight</f:call>
				} else {
					<f:call>drawObject focus mywidth myheight</f:call>
				},
				dragdrop content (SV.shape:left pos) (SV.shape:top pos)
			</f:call>
		</f:each></f:each>
	</div>
}