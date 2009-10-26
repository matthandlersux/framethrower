template() {
	test = template(x::Number)::Number {
		plus 100 x
	},
	debug = jsaction(s::String)::Void {
		console.debug(s);
	},
	debugNumber = jsaction(x::Number)::Void {
		console.debug(x);
	},
	Test := [Test2 Number Number],
	test2 = action(x::Test)::[(Number, Number)] {
		return x
	},
	Test2 := Tuple2,
	apply = f -> x -> f x,
	plus5 = apply (plus 5),
	test3 = apply plus5 1,
	test4 = state(Unit [String], ["yeah!"]),
	test5 = fetch test4,
	a = c,
	b = fetch y,
	c = plus b x,
	x = fetch y,
	f = x -> plus 50 x,
	y = state(Unit Number, 10),
	y = state(Unit Number, 100),
	swap = tuple -> (snd tuple, fst tuple),
	toTuple = list -> (head list, head (tail list)),
	toList = tuple -> [fst tuple, snd tuple],
	list = toList (swap (toTuple [1,2,3,4,5])),
	
	<div>
		<f:on mouseup>
			Test := Unit,
			x <- create(Test (Test2 Number Number)),
			debug (head test5),
			a0 <~ a,
			debugNumber a0,
			set y a0,
			debugNumber a0,
			set y a0,
			debugNumber a0
		</f:on>
		
		<div>{head list} {head test5} {f 5} {test3}</div>
		
		<f:call>test1 (test a)</f:call>
	</div>
}
