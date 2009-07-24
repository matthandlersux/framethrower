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
		<div style-background="#888">
			<f:on mousedown>
				add(s, plus a (subtract (fetch u) c))
			</f:on>
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
		<div style-width="10" style-height="10" style-background="#000">
			<f:on globalmousedown>
				add(s,1)
			</f:on>
		</div>
		<svg:svg width="{100}" height="50px" viewBox="{viewBox 600 600}" preserveAspectRatio="none">
			<svg:line x1="700" y1="0" x2="700" y1="1" stroke="black"/>
			<svg:line x1="600" y1="0" x2="1200" y1="1" stroke-width="0.1" stroke="black"/>
		</svg:svg>
	</f:wrapper>
}
