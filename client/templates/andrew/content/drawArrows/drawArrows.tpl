template (allPositions::Map Object SV.shape) {
	
	infons = filter isInfon (keys allPositions),
		
	<div>
		Positions:
		<f:each allPositions as key, position>
			<div>
				1 Position
			</div>
		</f:each>
		<f:each infons as infon>
			<div>
				1 Infon
			</div>
		</f:each>
	</div>
}