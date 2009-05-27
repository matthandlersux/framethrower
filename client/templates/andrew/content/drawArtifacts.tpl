template (focus::Object) {
	artifacts = getArtifacts focus,
	<f:each artifacts as artifact>
		<span>{artifact}</span>
	</f:each>
}