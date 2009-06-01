template (focus::Cons, pos::SV.shape) {
	relation = getInfonRelations focus,
	arguments = getArguments focus,
	asObject = Cons~Object focus,
	
	<svg:rect class="situationView-infon" width="100" height="100" x="0" y="0">
		<f:each relation as relation>
			<f:call>
				drawArtifacts relation
			</f:call>
		</f:each>
	</svg:rect>
}