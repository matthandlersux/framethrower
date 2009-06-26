template () {
	inc = x -> plus x 1,
	cur = state(Unit Number),
	next = mapUnit inc cur,
	
	<div style-background="#888">
		<f:on init>
			add(cur, 1)
		</f:on>
		
		<f:on mousedown>
			extract next as next {
				add(cur, next)
			}
			// extract cur as cur2 {
			// 	add(cur, inc cur2)
			// }
		</f:on>
		
		{cur}, {next}
	</div>
}
