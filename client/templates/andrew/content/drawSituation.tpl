template (focus::Object, width::Number, height::Number) {
	children = getChildren focus,
	<div>
		<div class="situationView-situation" style="width:{width};height:{height}">
			<f:call>drawArtifacts focus</f:call>
			<f:each children as child>
				drawChild child width height
			</f:each>
		</div>
	</div>
}