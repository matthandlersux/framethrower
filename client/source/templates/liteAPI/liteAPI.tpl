template() {
	getText = jsaction()::String {
		return document.getElementById("text").value;
	},
	getSelection = jsaction()::String {
		return document.getSelection();
	},
	debugNumber = jsaction(x::Number) {
		console.debug(x);
	},
	debugString = jsaction(s::String)::Void {
		console.debug(s);
	},
	indexOf = function(s::String, sub::String)::Number {
		return s.indexOf(sub);
	},
	
	sourceTextrange = state(Unit Textrange),
	destinationTextrange = state(Unit Textrange),
	
	<div>
		<textarea id="text" />
		<span style-background="#ccc">
			<f:on mouseup>
				note <- createNote,
				text <- getText,
				note_setText note text
			</f:on>
			Where's note!
		</span>
		
		<f:each allNotes as note>
		
			<div style-border="solid 1px">
				<div>
					{note_text note}
				</div>
				<span style-background="#ccc">
					<f:on mouseup>
						selected <- getSelection,
						debugString selected
					</f:on>
					Set source.
				</span>
				<span style-background="#ccc">
					<f:on mouseup>
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