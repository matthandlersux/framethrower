action (infon::Pipe, x::Number, y::Number, direction::Number) {
	
	
	
	content = <div>
		<f:call>
			timeObject = fetch (takeOne (getInfonRole ulinkTarget infon)),
			video = fetch (takeOne (bindUnitSet Situation:propVideo (bindSetUnit getAllInherits (Situation:container timeObject)))),
			
			time = Situation:propTime timeObject,
			intervalInfon = getInfonsAboutRole timeObject lineHasEndpointsBetween,
			intervalStart = bindUnit Situation:propTime (takeOne (bindSet (getInfonRole lineHasEndpointsStart) intervalInfon)),
			intervalEnd = bindUnit Situation:propTime (takeOne (bindSet (getInfonRole lineHasEndpointsEnd) intervalInfon)),
			
			myReactiveOr = x -> y -> flattenUnit (reactiveIfThen x x y),
			
			start = myReactiveOr intervalStart (mapUnit (swap subtract 2) time),
			end = myReactiveOr intervalEnd (mapUnit (plus 2) time),
			duration = mapUnit2 subtract end start,
			
			// getThumbnailURL = function (id::String, time::Number) {
			// 	return "http:/"+"/media.eversplosion.com/crop.php?file="+id+"-scrub&time="+time;
			// },
			// class = reactiveIfThen (bindUnit (reactiveEqual infon) hoveredInfon) "#fc0" "transparent",
			// <div>
			// 	//{time} - {ExtVideo:id video}
			// 	<img src="{getThumbnailURL (ExtVideo:id video) (fetch (myReactiveOr time intervalStart))}" style-padding="5" style-border="1px solid #ccc" style-margin="5" style-backgroundColor="{class}">
			// 		<f:call>hoveredInfonEvents infon</f:call>
			// 	</img>
			// </div>
			// 
			// 
			// extVideo = state {
			// 	create(ExtVideo, {id: "mr", aspectRatio: 2.222, duration: 7668})
			// },
			// 
			// 
			
			<f:each start as start>
				<f:each duration as duration>
					<f:call>drawVideoPlayer video start duration 400</f:call>
				</f:each>
			</f:each>
		</f:call>
	</div>,
	pop = create(Popup, {content: content, x: x, y: y, direction: direction, width: 400, height: 300}),
	add(popup, pop)
}