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
		</f:on>
		
		{cur}
	</div>
}
