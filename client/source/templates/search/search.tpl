template () {
	
	
	// ==============================================================
	// Population Init
	// ==============================================================
	
	ForwardIndex = state {
		DocToWords = create(Map String (Set String)),
		Doc1Words = create(Set String),
		add(Doc1Words, "answer"),
		add(Doc1Words, "attack"),
		add(Doc1Words, "sketch"),
		add(Doc1Words, "smile"),
		add(Doc1Words, "prance"),
		add(Doc1Words, "scavange"),
		
		Doc2Words = create(Set String),
		add(Doc2Words, "answer"),
		add(Doc2Words, "attack"),
		add(Doc2Words, "sketch"),
		add(Doc2Words, "smile"),
		add(Doc2Words, "computer"),
		add(Doc2Words, "android"),
		
		add(DocToWords, "verbs", Doc1Words),
		add(DocToWords, "nouns", Doc2Words),

		DocToWords
	},

	
	
	
	InvertedIndex = invert ForwardIndex,
	
	Terms = keys InvertedIndex,
	
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
			<div style="position:relative; left:5">
				<b>{Value}</b>
			</div>
		</f:each>
	},	
	
	SearchTerm = state(Unit String, ""),
	SearchResult = bindUnit (swap getKey InvertedPrefixes) SearchTerm,
	
	StringLength = function(s::String)::Number {
		return s.length
	},
	
	SubString = function(s::String, l::Number)::String {
		return s.substr(0, l);
	},
	
	TestString = "TestString",
	
	Prefixes = {
		Lengths = oneTo (StringLength TestString),
		mapSet (SubString TestString) Lengths::Set String
	},
	
	GetLengths = S -> oneTo (StringLength S) :: String -> Set Number,
	GetPrefixes = S -> mapSet (SubString S) (GetLengths S) :: String -> Set String,
	Prefixes = buildMap GetPrefixes Terms ::Map String (Set String),
	InvertedPrefixes = invert Prefixes,
	
	
	// ==============================================================
	// Draw it
	// ==============================================================
	
	<div style="position:absolute">
		<div>
			<div style="font-size:18; color:teal">Forward Index</div>
			<f:call>DrawIndex ForwardIndex</f:call>
		</div>
		<div style="position:absolute; top: 0; left:200; width:200">
			<div style="font-size:18; color:teal">Inverted Index</div>
			<f:call>DrawIndex InvertedIndex</f:call>
		</div>
		<div style="position:absolute; top: 0; left:400; width:200">
			<div style="font-size:18; color:teal">Terms</div>
			<f:call>DrawSet Terms</f:call>
		</div>
		<div style="position:absolute; top: 0; left:600; width:200">
			<div style="font-size:18; color:teal">Inverted Prefixes</div>
			<f:call>DrawIndex InvertedPrefixes</f:call>
		</div>
		<div style="position:absolute; top: 0; left:800; width:200">
			<input type="text">
				<f:on keydown>
					add(SearchTerm, event.value)
				</f:on>
			</input>
		</div>
		<div style="position:absolute; top: 22; left:800; width:155; background-color:rgb(68, 170, 255)">
			<f:each SearchResult as SearchResult>
				<f:call>DrawSet SearchResult</f:call>
			</f:each>
		</div>
	</div>
}