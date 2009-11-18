template() {
	getText = jsaction()::String {
		return document.getElementById("text").value;
	},
	getSelection = jsaction()::String {
		return document.getSelection();
	},
	debugNumber = jsaction(x::Number)::Void {
		console.debug(x);
	},
	debugString = jsaction(s::String)::Void {
		console.debug(s);
	},
	indexOf = function(s::String, sub::String)::Number {
		return s.indexOf(sub);
	},
	strlen = function(s::String)::Number {
		return s.length;
	},
	substr = function(s::String, start::Number, duration::Number)::String {
		return s.substr(start,duration);
	},
	
	
	// convenience:

	// textrange_text :: Textrange -> Unit String
	textrange_text = compose note_text textrange_note,
	// textrange_start :: Textrange -> Unit Number
	textrange_start = compose range_start textrange_range,
	// textrange_duration :: Textrange -> Unit Number
	textrange_duration = compose range_duration textrange_range,

	// timerange_start :: Timerange -> Unit Number
	timerange_start = compose range_start timerange_range,
	// timerange_duration :: Timerange -> Unit Number
	timerange_duration = compose range_duration timerange_range,
	
	
	findSelectedRange = action(note::Note)::Range {
		if note_text note as text {
			selected <- getSelection,
			i = indexOf text selected,
			range <- createRange,
			extract boolToUnit (not (or (equal selected "") (equal i -1))) as _ {
				setRange range (i, strlen selected)
			},
			return range
		} else {
			createRange
		}
	},
	
	linkRanges = action()::Void {
		note = textrange_note sourceTextrange,
		range = textrange_range sourceTextrange,
		note_linkToNote note range destinationTextrange,
		unset sourceTextrangeS,
		unset destinationTextrangeS
	},
	
	sourceTextrangeS = state(Unit Textrange),
	sourceTextrange = fetch sourceTextrangeS,
	destinationTextrangeS = state(Unit Textrange),
	destinationTextrange = fetch destinationTextrangeS,
	
	textrangeString0 = textrange -> mapUnit3 substr (textrange_text textrange) (textrange_start textrange) (textrange_duration textrange),
	textrangeString = textrange -> reactiveIfThen (textrangeString0 textrange) (textrangeString0 textrange) (textrange_text textrange),
	
	<div>
		<textarea id="text" />
		<span style-background="#ffa">
			<f:on mousedown>
				note <- createNote,
				text <- getText,
				note_setText note text
			</f:on>
			Where's note!
		</span>
		
		<f:each allNotes as note>
		
			<div style-border="solid 1px">
				<f:each boolToUnit (equal note (textrange_note sourceTextrange)) as _>
					<div style-background="#faa">source: {textrangeString sourceTextrange}</div>
				</f:each>
				<f:each boolToUnit (equal note (textrange_note destinationTextrange)) as _>
					<div style-background="#afa">destination: {textrangeString destinationTextrange}</div>
				</f:each>
				<div style-background="#ffc">
					{note_text note}
				</div>
				<span style-background="#faa">
					<f:on mousedown>
						range <- findSelectedRange note,
						set sourceTextrangeS (note, range),
						linkRanges
					</f:on>
					Set source.
				</span>
				<span style-background="#afa">
					<f:on mousedown>
						range <- findSelectedRange note,
						set destinationTextrangeS (note, range),
						linkRanges
					</f:on>
					Set destination.
				</span>
			
				<f:each note_linksToNotes note as range, textrange>
					<div>
						<span style-background="#fcc">{textrangeString (note, range)}</span>
						:-
						<span style-background="#cfc">{textrangeString textrange}</span>
					</div>
				</f:each>

				<f:each note_linksFromNotes note as textrange, range>
					<div>
						<span style-background="#cfc">{textrangeString (note, range)}</span>
						-:
						<span style-background="#fcc">{textrangeString textrange}</span>
					</div>
				</f:each>
			</div>
		</f:each>
	</div>
}