template (focus::Object, width::Unit Number, height::Unit Number) {
	<f:wrapper>
		<svg:rect class="situationView-object" width="{width}" height="{height}" x="0" y="0" shape-rendering="optimizeSpeed" />
		<f:call>
			drawArtifacts focus
		</f:call>
	</f:wrapper>
}