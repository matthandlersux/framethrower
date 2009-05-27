template (focus::Object, left::Number, top::Number, width::Number, height::Number) {
	children = getChildren focus,
	numChildren = length children,
	getChildSize = function(parentSize::Number, numChildren::Number) {
		return parentSize/numChildren;
	},
	childWidth = mapUnit (getChildSize width) numChildren,
	childHeight = mapUnit (getChildSize height) numChildren,
	
	
	<div class="situationView-situation" style="left:{left};top:{top};width:{width};height:{height}">
		<f:call>drawArtifacts focus</f:call>
		<f:each children as child>
			<f:each childWidth as childWidth>
				<f:each childHeight as childHeight>
					drawObject child left top childWidth childHeight
				</f:each>
			</f:each>
		</f:each>
	</div>
}