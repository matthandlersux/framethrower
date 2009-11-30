template() {
	getInnerHTML = jsaction(id::String)::String {
		return document.getElementById(id).innerHTML;
	},
	debugString = jsaction(s::String)::Void {
		console.debug(s);
	},
	updateSelection = jsaction()::Void {
		var range = window.getSelection().getRangeAt(0);
		var plus = document.getElementById('plus');
		// range.insertNode(plus);
	},
	x = [1,2,3,4,5],
	testAction = action() {
		xS <- create(Unit String),
		extract x as y {
			set xS "hey"
		},
		if xS as y {
			debugString "yep",
			return y
		} else {
			debugString "nope",
			return ""
		}
	},
	
	<div>
		<f:on mouseup>
			updateSelection,
			y <- testAction,
			debugString y
		</f:on>
		
		inedible
		
		<div id="text" contentEditable="true">
			On the seventh day, chaos died.
			<span id="plus" style-background="#faa">+</span>
		</div>
		
		<div>
			{head (tail x)}
		</div>
	</div>
}