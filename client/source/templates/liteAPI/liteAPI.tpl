template() {
	
	// ====================================================
	// State
	// ====================================================
	
	sourceTextRangeS = state(Unit TextRange),
	sourceTextRange = fetch sourceTextRangeS,
	
	targetTextRangeS = state(Unit TextRange),
	targetTextRange = fetch targetTextRangeS,
	
	
	// ====================================================
	// UI and Ontology
	// ====================================================
	
	getText = jsaction()::String {
		return document.getElementById("text").value;
	},
	
	getSelection = jsaction()::String {
		return document.getSelection()+"";
	},
	
	createSelectedTextRange = action(note::Note)::TextRange {
		textRange <- createTextRange note,
		extract note_text note as text {
			selected <- getSelection,
			debugString selected,
			i = indexOf text selected,
			extract boolToUnit (not (or (equal selected "") (equal i -1))) as _ {
				textRange_setRange textRange (makeRange i (strlen selected))
			}
		},
		return textRange
	},
	
	linkRanges = action()::Void {
		linkText (makeTextLink sourceTextRange targetTextRange),
		unset sourceTextRangeS,
		unset targetTextRangeS
	},


	// ====================================================
	// Utility
	// ====================================================
	
	indexOf = function(s::String, sub::String)::Number {
		return s.indexOf(sub);
	},
	strlen = function(s::String)::Number {
		return s.length;
	},
	substr = function(s::String, start::Number, length::Number)::String {
		return s.substr(start,length);
	},
	debugNumber = jsaction(x::Number)::Void {
		console.debug(x);
	},
	debugString = jsaction(s::String)::Void {
		console.debug(s);
	},

	textRange_text = compose note_text textRange_note,
	textRange_start = textRange -> mapUnit range_start (textRange_range textRange),
	textRange_length = textRange -> mapUnit range_length (textRange_range textRange),

	textRangeString0 = textRange -> mapUnit3 substr (textRange_text textRange) (textRange_start textRange) (textRange_length textRange),
	textRangeString = textRange -> reactiveIfThen (textRangeString0 textRange) (textRangeString0 textRange) (textRange_text textRange),
	



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
				<f:each boolToUnit (equal note (textRange_note sourceTextRange)) as _>
					<div style-background="#faa">source: {textRangeString sourceTextRange}</div>
				</f:each>
				<f:each boolToUnit (equal note (textRange_note targetTextRange)) as _>
					<div style-background="#afa">target: {textRangeString targetTextRange}</div>
				</f:each>
				<div style-background="#ffc">
					{note_text note}
				</div>
				<span style-background="#faa">
					<f:on mousedown>
						textRange <- createSelectedTextRange note,
						set sourceTextRangeS textRange,
						linkRanges
					</f:on>
					Set source.
				</span>
				<span style-background="#afa">
					<f:on mousedown>
						textRange <- createSelectedTextRange note,
						set targetTextRangeS textRange,
						linkRanges
					</f:on>
					Set target.
				</span>
			
				<f:each note_linksToNotes note as link>
					<div>
						<span style-background="#fcc">{textRangeString (textLink_source link)}</span>
						:-
						<span style-background="#cfc">{textRangeString (textLink_target link)}</span>
					</div>
				</f:each>

				<f:each note_linksFromNotes note as link>
					<div>
						<span style-background="#cfc">{textRangeString (textLink_target link)}</span>
						-:
						<span style-background="#fcc">{textRangeString (textLink_source link)}</span>
					</div>
				</f:each>
			</div>
		</f:each>
	</div>
}
