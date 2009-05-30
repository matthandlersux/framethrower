template(shape::SV.shape) {
	asObject = returnFutureUnit (SV.shape:focus shape),
	focus = bindUnit Object~Cons asObject,

	<f:each focus as focus>
		relation = getInfonRelations focus,
		arguments = getArguments focus,
		<f:each arguments as num, argument><f:each argument as argument>
			bestMatch = findBestMatch argument allPositions,
			<f:each bestMatch as bestMatch>
				drawArrow shape bestMatch
			</f:each>
		</f:each></f:each>
	</f:each>
}