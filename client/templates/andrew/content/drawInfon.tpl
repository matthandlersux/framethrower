template (focus::Cons, width::Unit Number, height::Unit Number) {
	relation = getInfonRelations focus,
	arguments = getArguments focus,
	asObject = Cons~Object focus,
	
	<f:wrapper>
		<svg:rect class="situationView-infon" width="{width}" height="{height}" x="0" y="0" shape-rendering="optimizeSpeed" />
		<f:each relation as relation>
			<f:call>drawArtifacts relation</f:call>
		</f:each>
	</f:wrapper>
}