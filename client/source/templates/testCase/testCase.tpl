template () {
	videoDuration = 1000,
	minZoomDuration = 10,
	scrollwheelFactor = 0.666,
	
	zoomDurationS = state(Unit Number, 100),
	zoomDuration = fetch zoomDurationS,

	<svg:svg width="{videoDuration}" height="50" color-rendering="optimizeSpeed" shape-rendering="optimizeSpeed" text-rendering="optimizeSpeed" image-rendering="optimizeSpeed">
		<f:on mousescroll> // zoom in or out on zoomed scrubber
			durationFactor = pow scrollwheelFactor (sign event.wheelDelta),
			// extract zoomDurationS as zoomDuration {
			// 	newDuration = clamp minZoomDuration videoDuration (product zoomDuration durationFactor),
			// 	add(zoomDurationS, newDuration)
			// }
			extract mapUnit (zoomDuration -> clamp minZoomDuration videoDuration (product zoomDuration durationFactor)) zoomDurationS as _fetch {
				add(zoomDurationS, _fetch)
			}
		</f:on>

		<svg:rect width="100%" height="100%" fill="#AAF"/> // background
		<svg:rect width="{zoomDuration}" height="100%" fill="#AAA" stroke-width="1" stroke="blue"/>
	</svg:svg>
}
