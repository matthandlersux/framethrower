//width, height are the bounds imposed by the parent
template (focus::Object, width::Number, height::Number) {
	children = getChildren focus,
	// numChildren = length children,
	// getChildSize = function(parentSize::Number, numChildren::Number) {
	// 	return parentSize/numChildren;
	// },
	// childWidth = mapUnit (getChildSize width) numChildren,
	// childHeight = mapUnit (getChildSize height) numChildren,
	myleft = state(Unit Number),
	mytop = state(Unit Number),
	mywidth = state(Unit Number),
	myheight = state(Unit Number),
	
	<div>
		<f:on init>randomLocation myleft mytop mywidth myheight width height</f:on>
		<f:each myleft as myleft><f:each mytop as mytop><f:each mywidth as mywidth><f:each myheight as myheight>
			<div class="situationView-situation" style="left:{myleft};top:{mytop};width:{mywidth};height:{myheight}">
				<f:call>drawArtifacts focus</f:call>
				<f:each children as child>
					// <f:each childWidth as childWidth>
					// 	<f:each childHeight as childHeight>
							drawObject child mywidth myheight
						// </f:each>
					// </f:each>
				</f:each>
			</div>
		</f:each></f:each></f:each></f:each>
	</div>
}