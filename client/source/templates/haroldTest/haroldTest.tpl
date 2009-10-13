template() {
	test = template(x::Number)::Number {
		plus 100 x
	},
	Hey := Tuple,
	debug = jsaction(s::String)::Void {
		console.debug(s);
	},
	test2 = action(x::[(Number, Number)])::[(Number, Number)] {
		return x
	},
	test4 = state(Unit [String], ["yeah!"]),
	test5 = fetch test4,
	w = z,
	z = plus 1 x,
	x = fetch y,
	y = state(Unit Number, 10),
	y = state(Unit Number, 100),
	swap = tuple -> (snd tuple, fst tuple),
	toTuple = list -> (head list, head (tail list)),
	toList = tuple -> [fst tuple, snd tuple],
	list = toList (swap (toTuple [1,2,3,4,5])),
	
	<div>
		<f:on mouseup>
			x <- create(Unit (Number, Number)),
			debug (head test5)
		</f:on>
		
		<div>{head list} {head test5}</div>
		
		<f:call>test1 (test w)</f:call>
	</div>
}
