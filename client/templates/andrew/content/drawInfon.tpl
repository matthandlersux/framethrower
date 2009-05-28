template (focus::Cons, width::Number, height::Number) {
	relation = getInfonRelations focus,
	arguments = getArguments focus,
	asObject = Cons~Object focus,
	
	<div class="situationView-infon" style="width:{width};height:{height}">
		<f:each relation as relation>
			<f:call>
				drawArtifacts relation
			</f:call>
		</f:each>
	</div>
}