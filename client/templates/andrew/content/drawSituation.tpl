template (focus::Object, top::Number, left::Number, width::Number, height::Number) {
	children = getChildren focus,
	<f:wrapper>
		<svg:rect class="situationView-situation" width="{width}" height="{height}" x="0" y="0" />
		<f:call>drawArtifacts focus</f:call>
		<f:each children as child>
			drawChild child 0 0 width height
		</f:each>
	</f:wrapper>
	
}