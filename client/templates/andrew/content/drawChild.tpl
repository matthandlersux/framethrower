//width, height are the bounds imposed by the parent
template (focus::Object, width::Number, height::Number) {
	myleft = state(Unit Number),
	mytop = state(Unit Number),
	mywidth = state(Unit Number),
	myheight = state(Unit Number),
	
	<div>
		<f:on init>randomLocation mytop myleft mywidth myheight width height</f:on>
		//add case statement here
		<f:each mywidth as mywidth><f:each myheight as myheight>
			<f:call>
				content = if isSituation focus as _ {
					<f:call>drawSituation focus mywidth myheight</f:call>
				} else {
					<f:call>drawObject focus mywidth myheight</f:call>
				},
				dragdrop content myleft mytop
			</f:call>
		</f:each></f:each>
	</div>
}