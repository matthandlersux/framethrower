template (popup::Popup) {
	screenWidth = fetch (UI.ui:screenWidth ui.ui),
	screenHeight = fetch (UI.ui:screenHeight ui.ui),
	
	width = Popup:width popup,
	height = Popup:height popup,
	x = Popup:x popup,
	y = Popup:y popup,
	direction = Popup:direction popup,
	
	content = Popup:content popup,
	
	<div>
		<div style-position="absolute" style-backgroundColor="#fff" style-width="{width}" style-height="{height}" style-left="{x}" style-top="{y}">
			<f:call>
				if reactiveEqual direction 0 as _ {
					<div>horizontal</div>
				} else {
					<div>vertical</div>
				}
			</f:call>
			<f:call>content</f:call> {direction}
		</div>
	</div>
}