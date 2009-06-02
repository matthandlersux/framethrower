{
	containHTML = template (x::Unit Number, y::Unit Number, content::XMLP) {
		<div style-left="{x}" style-top="{y}">
			<f:call>content</f:call>
		</div>
	},
	dragdrop containHTML
}