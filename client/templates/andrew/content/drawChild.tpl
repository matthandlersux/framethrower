//width, height are the bounds imposed by the parent
template (focus::Object, width::Number, height::Number) {
	
	//replace state(REACTIVE TYPE, INIT ACTION?) with state(ACTION)
	//allow actions to return the last line
	myLeft = state{
		L = create(Unit Number),
		add(L, 5),
		L 		//return L
	},
	
	//then it can also work for non-reactive objects
	myposition = state{
		newShape = create(SV.shape),
		add(SV.shape:width newShape, 50),
		add(SV.shape:height newShape, 100),
		newShape	//return newShape
	},
	
	makeShape = action(){
		newShape = create(SV.shape),
		add(myposition, newShape)
	},
	
	<div>
		<f:on init>makeShape</f:on>
		<f:on init>randomLocation myposition width height</f:on>
		//add case statement here
		<f:each myposition as myposition>
			<f:call>
				mywidth = SV.shape:width myposition,
				myheight = SV.shape:height myposition,
				myleft = SV.shape:left myposition,
				mytop = SV.shape:top myposition,
				content = if isSituation focus as _ {
					<f:call>drawSituation focus mywidth myheight</f:call>
				} else {
					<f:call>drawObject focus mywidth myheight</f:call>
				},
				dragdrop content myleft mytop
			</f:call>
		</f:each>
	</div>
}