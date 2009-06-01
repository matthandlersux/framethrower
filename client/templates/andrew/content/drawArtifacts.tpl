template (focus::Object) {
	artifacts = getArtifacts focus,
	<f:each artifacts as artifact>
		<svg:text x="3" y="17">
			{artifact}
		</svg:text>
	</f:each>
}