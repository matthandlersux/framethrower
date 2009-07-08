template () {
	// ==============================================================
	// Util Functions
	// ==============================================================	
	
	StringLength = function(s::String)::Number {
		return s.length
	},
	
	SubString = function(s::String, l::Number)::String {
		return s.substr(0, l);
	},
	
	// ==============================================================
	// Population Init
	// ==============================================================
	
	Docs = state {
		Docs = create(Set String),
		add(Docs, "We don't read and write poetry because it's cute. We read and write poetry because we are members of the human race. And the human race is filled with passion. And medicine, law, business, engineering, these are noble pursuits and necessary to sustain life. But poetry, beauty, romance, love, these are what we stay alive for. Professor Keating (Robin Williams) in 'Dead Poet's Society'	"),
		add(Docs, "Colonel Jessep: You want answers? Kaffee: I want the truth. Jessep: You can't handle the truth!"),
		add(Docs, "Michael Corleone: My father is no different than any powerful man, any man with power, like a President or senator. Kay Adams: Do you know how naive you sound, Michael? Presidents and senators don't have men killed. Michael Corleone: Oh. Who's being naive, Kay? 'The Godfather'"),
		Docs
	},

	// ==============================================================
	// UI State
	// ==============================================================
	
	RawPrefixInput = state(Unit String, ""),
	EnteredInput = state(Unit String, ""),
	SelectedTerm = state(Unit Number, 0),
	KeyCode = state(Unit String, ""),
	
	// ==============================================================
	// Build Indices
	// ==============================================================
	
	ParseWords = function (s::String)::Set String {
		var input = s.replace(/[^A-Z^a-z^ ]*/g, "");
		input = input.toLowerCase();
		var words = input.split(" ");
		return arrayToSet(words);
	},
	
	ProcessWord = function (s::String)::String {
		var input = s.replace(/[^A-Z^a-z^ ]*/g, "");
		return input.toLowerCase();
	},
	
	ForwardIndex = buildMap ParseWords Docs,
	
	InvertedIndex = invert ForwardIndex,
	
	Terms = keys InvertedIndex,
	
	
	// ==============================================================
	// Search
	// ==============================================================
	
	PrefixInput = mapUnit ProcessWord RawPrefixInput,
	PrefixMatches = flattenUnitSet (bindUnit (swap getKey InvertedPrefixes) PrefixInput)::Set String,
	// PrefixNums = bindSetUnit oneTo (length PrefixMatches)::Set Number,
	// PrefixOrds = mapSet numToOrd PrefixNums::Set Ord,
	
	PrefixMatchesList = buildMap (a -> getPosition a PrefixMatches) PrefixMatches::Map String (Unit Number),
	
	SearchInput = mapUnit ProcessWord EnteredInput,
	SearchResults = bindUnit (swap getKey InvertedIndex) SearchInput,
	
	GetLengths = S -> oneTo (StringLength S) :: String -> Set Number,
	GetPrefixes = S -> mapSet (SubString S) (GetLengths S) :: String -> Set String,
	Prefixes = buildMap GetPrefixes Terms ::Map String (Set String),
	InvertedPrefixes = invert Prefixes,
	
	
	// ==============================================================
	// Draw functions
	// ==============================================================

	DrawIndex = template (Index::Map String (Set String)) {
		<f:each Index as Key, Value>
			<div style="position:relative; left:5">
				<b>{Key}</b>
				<f:each Value as Value>
					<div style="position:relative; left:10">
						{Value}
					</div>
				</f:each>
			</div>
		</f:each>
	},	
	
	DrawSet = template (ASet::Set a) {
		<f:each ASet as Value>
			<div style="position:relative; padding-top:10; left:5">
				{Value}
			</div>
		</f:each>
	},
	
	DrawPrefixMatches = template (AList::Map String (Unit a)) {
		DrawPrefixMatch = template (Value::String, Index::Unit Number) {
			if bindUnit boolToUnit (mapUnit2 equal Index SelectedTerm) as _ {
				<div style="position:relative; padding-top:10; padding-left:5; background-color:teal">
					{Value}
				</div>
			} else {
				<div style="position:relative; padding-top:10; padding-left:5">
					{Value}
				</div>
			}
		},
		<f:each AList as Value, Index>
			<f:call>DrawPrefixMatch Value Index</f:call>
		</f:each>
	},


	
	<div style="position:absolute" style-height="400px">
		<div style="position:absolute; top: 0; left:0; width:600">
			<div style="font-size:18; color:teal">Source</div>
			<f:call>DrawSet (keys ForwardIndex)</f:call>
		</div>
		// <div style="position:absolute; top: 0; left:200; width:200">
		// 	<div style="font-size:18; color:teal">Inverted Index</div>
		// 	<f:call>DrawIndex InvertedIndex</f:call>
		// </div>
		// <div style="position:absolute; top: 0; left:400; width:200">
		// 	<div style="font-size:18; color:teal">Terms</div>
		// 	<f:call>DrawSet Terms</f:call>
		// </div>
		// <div style="position:absolute; top: 0; left:600; width:200">
		// 	<div style="font-size:18; color:teal">Inverted Prefixes</div>
		// 	<f:call>DrawIndex InvertedPrefixes</f:call>
		// </div>
		<div style="position:absolute; top: 0; left:800; width:200">
			<div style="font-size:18; color:teal">Search</div>
			<f:each KeyCode as KeyCode><div>
				KeyCode: {KeyCode}
			</div></f:each>		
			<div>Click Down
				<f:on click>
					currentOrd = extract SelectedTerm,
					add(SelectedTerm, plus 1 currentOrd)
				</f:on>
			</div>
			<f:each SelectedTerm as SelectedTerm>
				<div>
					SelectedTerm: {SelectedTerm}
				</div>
			</f:each>
			<input type="text">
				<f:on blur>
					add(EnteredInput, event.value),
					add(RawPrefixInput, "")
				</f:on>
				<f:on keyup>
					add(KeyCode, event.keyCode),
					extract boolToUnit (equal event.keyCode 40) as _ {
						currentOrd = extract SelectedTerm,
						add(SelectedTerm, plus 1 currentOrd)
					},
					extract boolToUnit (equal event.keyCode 38) as _ {
						currentOrd = extract SelectedTerm,
						add(SelectedTerm, subtract currentOrd 1)
					},
					extract boolToUnit (or (equal event.keyCode 8) (and (greaterThan event.keyCode 64) (lessThan event.keyCode 123))) as _ {
						add(RawPrefixInput, event.value),
						add(SelectedTerm, 0)
					},
					extract boolToUnit (equal event.keyCode 13) as _ {
						add(EnteredInput, event.value),
						add(RawPrefixInput, "")
					},
				</f:on>
			</input>
			<div style="position:relative; top: 0; width:155; background-color:rgb(68, 170, 255)">
				<f:call>DrawPrefixMatches PrefixMatchesList</f:call>
			</div>
			<div style="position:relative; top: 100; width:200">
				<div style="font-size:18; color:teal">Results</div>
				<f:each SearchResults as SearchResults>
					<f:call>DrawSet SearchResults</f:call>
				</f:each>
			</div>		
		</div>
	</div>
}