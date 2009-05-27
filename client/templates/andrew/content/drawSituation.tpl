template (focus::Object, left::Number, top::Number, width::Number, height::Number) {
	children = getChildren focus,
	getChildSize = function(parentSize::Number, numChildren::Number) {
		return parentSize/numChildren;
	},
	childWidth = getChildSize width 3,
	childHeight = getChildSize height 3,
	<div class="situationView-situation" style="left:{left};top:{top};width:{width};height:{height}">
		<f:call>drawArtifacts focus</f:call>
		<f:each children as child>
			<f:call>
				drawObject child left top childWidth childHeight
			</f:call>
		</f:each>
	</div>
}