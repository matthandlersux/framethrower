template () {
	//functions
	divide = function (x::Number, y::Number)::Number {
		return x / y;
	},
	
	//states
	mouseOnTimeLine = state(Unit Null),
	timeLineHeight = state {
		t = create(Unit Number),
		add(t, 180),
		t
	},
	zoomDisplay = state {
		z = create(Unit String),
		add(z, "none"),
		z
	},
	timeLineTop = state {
		y = create(Unit Number),
		mapUnit2 subtract (UI.ui:screenHeight ui.ui) timeLineHeight
	},
	zoomBoxY = state {
		halfTimeLine = mapUnit2 divide timeLineHeight (returnUnit 2),
		mapUnit2 subtract (mapUnit2 plus timeLineTop halfTimeLine) (returnUnit 70)
	},
	zoomBoxX = state {
		x = create(Unit Number),
		add(x, 0),
		x
	},
	//output
	<f:wrapper>
		<div id="timeLine" style-width="{UI.ui:screenWidth ui.ui}" style-top="{timeLineTop}">
			<f:on mouseover>
				x = mapUnit2 subtract (UI.ui:mouseX ui.ui) (returnUnit 70),
				extract x as zx {
					add(zoomBoxX, zx)
				},
				add(zoomDisplay, "block")
			</f:on>
			<f:on mouseout>
				add(zoomDisplay, "none")
			</f:on>
			timeline
		</div>
		<div id="zoomTimeLine" style-display="{zoomDisplay}" style-top="{zoomBoxY}" style-left="{zoomBoxX}">
			<f:on mouseover>
				add(zoomDisplay, "block")
			</f:on>
			zoom
		</div>
	</f:wrapper>
}