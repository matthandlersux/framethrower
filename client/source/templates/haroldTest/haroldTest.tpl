template() {
	test = template(x::Number)::Number {
		plus 100 x
	},
	debug = jsaction(s::String)::Void {
		console.debug(s);
	},
	w = z,
	z = plus 1 x,
	x = fetch y,
	y = state(Unit Number, 10),
	y = state(Unit Number, 100),
	
	<div>
		<f:on mouseup>
			debug "hey!"
		</f:on>
		<f:call>test1 (test w)</f:call>
	</div>
}
