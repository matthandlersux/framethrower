template () {
	
	// UI Constants
	padding = 6,
	triangleSize = 20,
	
	
	
	
	<f:each tooltipS as tt>
	
		width = tooltipWidth tt,
		height = tooltipHeight tt,
		x = tooltipX tt,
		y = tooltipY tt,
		isHorizontal = tooltipIsHorizontal tt,
		
		content = tooltipContent tt,

		printHorizontal = template (x, y) {
			<div style-position="absolute" style-left="{x}" style-top="{subtract y 400}" style-height="800" style-display="table">
				<div style-display="table-cell" style-verticalAlign="middle">
					<div style-width="{width}" style-backgroundColor="#fff" style-border="1px solid #ccc" style-padding="{padding}">
						<f:call>content</f:call>
					</div>
				</div>
			</div>
		},

		printVertical = template (x, top, bottom) {
			<div style-position="absolute" style-left="{x}" style-top="{top}" style-bottom="{bottom}" style-width="{width}" style-backgroundColor="#fff" style-border="1px solid #ccc" style-padding="{padding}">
				<f:call>content</f:call>
			</div>
		},
		
		js = function (printHorizontal, printVertical, screenWidth::Number, screenHeight::Number, width::Number, height::Number, x::Number, y::Number, isHorizontal::Bool, triangleSize::Number, padding::Number)::XMLP {
			if (isHorizontal) {
				// var top="auto", bottom="auto";
				// if (height - triangleSize > y) {
				// 	top = 0;
				// } else {
				// 	bottom = screenHeight - y - triangleSize;
				// }
				// 
				var left;
				var top = "auto", bottom="auto";
				if (y > screenHeight / 2) {
					bottom = Math.min(screenHeight, screenHeight - y - triangleSize);
				} else {
					top = Math.max(0, y - triangleSize);
				}
				if (screenWidth < x + triangleSize + width) {
					left = x - width - triangleSize - padding;
				} else {
					left = x + triangleSize + padding;
				}
				return evaluate(makeApplyWith(printVertical, left, top, bottom));
				//return evaluate(makeApplyWith(printHorizontal, left, y));
			} else {
				var left = Math.max(0+padding, Math.min(screenWidth - width - padding, x - width/2));
				var top = "auto", bottom="auto";
				if (y > screenHeight / 2) {
					bottom = screenHeight - y + triangleSize + padding;
				} else {
					top = y + triangleSize;
				}
				return evaluate(makeApplyWith(printVertical, left, top, bottom));
			}
		},
		
		<div>
			//Tooltip showing!
			<f:call>
				js printHorizontal printVertical screenWidth screenHeight width height x y isHorizontal triangleSize padding
			</f:call>
			//<div style-position="absolute" style-top="{y}" style-left="{x}" style-backgroundColor="#000" style-width="2" style-height="2" />
		</div>
	</f:each>
	

	

	

}





// 
// 
// 
// template () {
// 	// UI constants
// 	padding = 6,
// 	border = 1,
// 	triangleSize = 12,
// 	
// 	
// 	bottomTop = function (isBottom::Bool, y::Number, screenHeight::Number)::String {
// 		if (isBottom) {
// 			if (y > screenHeight / 2) {
// 				return ""+y;
// 			} else {
// 				return "auto";
// 			}
// 		} else {
// 			if (y > screenHeight / 2) {
// 				return "auto";
// 			} else {
// 				return ""+y;
// 			}
// 		}
// 	},
// 	
// 	<f:each tooltipS as tt>
// 		position = tooltipPosition tt,
// 		<div style-position="absolute" style-left="{posX position}" style-bottom="{bottomTop true (posY position) screenHeight}" style-top="{bottomTop false (posY position) screenHeight}">
// 			// content
// 			// "speech bubble" triangle
// 			
// 			
// 			
// 			
// 		</div>
// 	</f:each>
// }