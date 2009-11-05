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
	templateTest = template(x)::Number {
		plus 1 x
	},
	ifTest =
	if y as x {
		<div>y={x}</div>
	} else {
		<div>y=empty</div>
	},
	mapTest = state{m<-create(Map Number Number), addEntry m 0 1, addEntry m 1 -1, return m},
	
	<div>
		<f:on mouseup>
			Test := Unit,
			x <- create(Test (Test2 Number Number)),
			debug (head test5),
			a0 <~ a::Number,
			debugNumber a0,
			set y a0,
			debugNumber a0,
			set y a0,
			debugNumber a0,
			debugNumber (templateTest 5),
			extract test5 as s {
				debug s
			},
			extract mapTest as k,v {
				debug "key",
				debugNumber k,
				debug "val",
				debugNumber v
			},
			action() {
				debug "action in action"
			},
			if y as x {
				debug "yes",
				debugNumber x
			} else {
				debug "no"
			}
		</f:on>
		
		<f:call>
			ifTest
		</f:call>
		
		<f:each mapTest as k,v>
			<div>{k} {v}</div>
		</f:each>
		
		<div>{head list} {head test5} {f 5} {test3} {ifTest}</div>
		
		<f:call>test1 (test a)</f:call>
	</div>
}
