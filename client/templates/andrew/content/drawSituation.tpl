template (focus::Object, width::Unit Number, height::Unit Number, top::Unit Number, left::Unit Number) {
	children = getChildren focus,
	<f:wrapper>
		<svg:rect class="situationView-situation" width="{width}" height="{height}" x="0" y="0" />
		<f:call>drawArtifacts focus</f:call>
		<f:each children as child><f:each width as width><f:each height as height>
			drawChild child width height top left
		</f:each></f:each></f:each>
	</f:wrapper>
	
}