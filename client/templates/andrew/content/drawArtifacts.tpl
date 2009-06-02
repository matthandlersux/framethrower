template (focus::Situation) {
	artifacts = getArtifacts focus,
	<f:each artifacts as artifact>
		<svg:text x="3" y="17" shape-rendering="optimizeSpeed" >
			{artifact}
		</svg:text>
	</f:each>
}