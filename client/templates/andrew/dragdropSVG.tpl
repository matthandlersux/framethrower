{
	containSVG = template (x::Unit Number, y::Unit Number, content::XMLP) {
		makeTranslateString = function(x, y) {
			return "translate(" + x + "," + y + ")";
		},
		translate = mapUnit2 makeTranslateString x y,
		<svg:g transform="{translate}">
			<f:call>content</f:call>
		</svg:g>
	},
	dragdrop containSVG
}