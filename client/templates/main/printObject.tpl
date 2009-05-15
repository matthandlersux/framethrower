template (focus::Object) {
	name = getName focus,
	<div>
	Name!
	{name}
		<f:each name as theName>
			<span>{theName}</span>
		</f:each>
	</div>
}