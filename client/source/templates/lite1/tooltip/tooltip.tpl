template () {
	computeLeftBottom = function (x::Number, y::Number, width::Number, height::Number)::(Number, Number) {
		
		return makeTuple2(x, (height - y) + 10);
	},
	leftBottom = computeLeftBottom (fetch (UI.ui:mouseX ui.ui)) (fetch (UI.ui:mouseY ui.ui)) (fetch (UI.ui:screenWidth ui.ui)) (fetch (UI.ui:screenHeight ui.ui)),
	left = fst leftBottom,
	bottom = snd leftBottom,
	
	<f:each tooltipS as t>
		<div class="zTooltip tooltip" style-position="absolute" style-left="{left}" style-bottom="{bottom}" style-width="160">
			{t}
		</div>
	</f:each>
}