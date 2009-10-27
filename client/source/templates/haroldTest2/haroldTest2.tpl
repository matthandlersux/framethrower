template() {
	xS = state(Unit Number, 1),
	doSet = action(s::Unit Number)::Void {
		extract s as x {
			set xS x
		}
	},
	doInc = doSet (mapUnit (plus 1) xS),
	
	<div>
		<f:on mousedown>
			doInc
		</f:on>
		{xS}
	</div>
}