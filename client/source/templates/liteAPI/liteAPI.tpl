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
	
	findSelectedRange = action(note::Note)::Range {
		if note_text note as text {
			selected <- getSelection,
			i = indexOf text selected,
			range <- createRange,
			extract boolToUnit (not (or (equal selected "") (equal i -1))) as _ {
				set range (i, strlen selected)
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
	
	<div>
		<textarea id="text" />
		<span style-background="#ccc">
			<f:on mousedown>
				note <- createNote,
				text <- getText,
				note_setText note text
			</f:on>
			Where's note!
		</span>
		
		<div>
			{range_start (textrange_range sourceTextrange)}
			{range_duration (textrange_range sourceTextrange)}
			{range_start (textrange_range destinationTextrange)}
			{range_duration (textrange_range destinationTextrange)}
			{sourceTextrange}
		</div>
		
		<f:each allNotes as note>
		
			<div style-border="solid 1px">
				<f:each boolToUnit (equal note (textrange_note sourceTextrange)) as _>
					<div>source</div>
				</f:each>
				<f:each boolToUnit (equal note (textrange_note destinationTextrange)) as _>
					<div>destination</div>
				</f:each>
				<div>
					{note_text note}
				</div>
				<span style-background="#ccc">
					<f:on mousedown>
						range <- findSelectedRange note,
						set sourceTextrangeS (note, range),
						linkRanges
					</f:on>
					Set source.
				</span>
				<span style-background="#ccc">
					<f:on mousedown>
						range <- findSelectedRange note,
						set destinationTextrangeS (note, range),
						linkRanges
					</f:on>
					Set destination.
				</span>
			
				<f:each note_linksToNotes note as range, textrange>
					<div>1</div>
				</f:each>
			</div>
		</f:each>
	</div>
}