template () {
	
	
	// ==============================================================
	// Population Init
	// ==============================================================
	
	ForwardIndex = state {
		DocToWords = create(Map String (Set String)),
		Doc1Words = create(Set String),
		add(Doc1Words, "andrew"),
		add(Doc1Words, "toby"),
		add(Doc1Words, "matt"),
		add(Doc1Words, "harold"),
		
		Doc2Words = create(Set String),
		add(Doc2Words, "erlang"),
		add(Doc2Words, "html"),
		add(Doc2Words, "xsl"),
		add(Doc2Words, "javascript"),
		
		add(DocToWords, "people", Doc1Words),
		add(DocToWords, "languages", Doc2Words),

		DocToWords
	},

	
	
	
	InvertedIndex = invert ForwardIndex,
	
	DrawIndex = template (Index::Map String (Set String)) {
		<f:each ForwardIndex as Key, Value>
			<div style-left="10px">
				<b>
					Key: {Key}
				</b>
				<f:each Value as Value>
					<div style-left="5px">
						Value: {Value}
					</div>
				</f:each>
			</div>
		</f:each>
	},	
	
	// ==============================================================
	// Draw it
	// ==============================================================
	
	<f:wrapper>
		<div style-border="1px solid black">
			<h1>Forward Index</h1>
			<f:call>DrawIndex ForwardIndex</f:call>
		</div>
		<div style-border="1px solid black">
			<h1>Inverted Index</h1>
			<f:call>DrawIndex InvertedIndex</f:call>
		</div>
	</f:wrapper>
}