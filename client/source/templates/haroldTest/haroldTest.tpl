template() {
	s = state(Unit Number, 1),
	t = state(Unit (Unit Number), s),
	a = fetch s,
	b = fetch t,
	c = fetch b,
	u = unfetch (plus a c),
	
	viewBox = function(start, duration) {
		return start+" 0 "+duration+" 1";
	},
	
	<f:wrapper>
		<f:on mousedown>
			add(s, plus a (subtract (fetch u) c))
		</f:on>
		<div style-background="#888">
			<f:each b as x>
				<f:each u as y>
					<div>{x} {y}</div>
				</f:each>
			</f:each>
			<f:call>test1 a</f:call>
			<f:call>test1 (plus 1 a)</f:call>
			{s}
			{t}
			{u}
		</div>
		<svg:svg width="100px" height="50px">
			<svg:defs>
				<svg:line id="line" x1="0" x2="0" y1="0" y2="1" stroke="black" stroke-width="{s}"/>
			</svg:defs>
			<svg:rect x="0" y="0" width="100%" height="100%" fill="blue"/>
			<svg:g transform="scale(0.05,50) translate(-900,0) ">
				<svg:rect x="900" y="0" width="1000" height="1" fill="black" opacity="0.5"/>
				<svg:use x="900" xlink:href="#line"/>
				<svg:use x="1000" y="0.1" xlink:href="#line"/>
			</svg:g>
		</svg:svg>
	</f:wrapper>
}
