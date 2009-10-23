template() {
	xS = state(Unit Number, 1),
	yS = state(Unit Number, 2),
	
	<f:wrapper>
		<f:each xS as x>
			<f:each yS as y>
				<div> {plus x y} </div>
			</f:each>
		</f:each>
		
		<div> {plus (fetch xS) (fetch yS)} </div>
	</f:wrapper>
}