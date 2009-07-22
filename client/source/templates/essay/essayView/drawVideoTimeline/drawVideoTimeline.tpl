template (videoTimeline::VideoTimeline) {
	movie = VideoTimeline:movie videoTimeline,
	extVideo = fetch (takeOne (bindUnitSet Situation:propVideo (getAllInherits movie))),
	
	<div>
		This is the video timeline for {Situation:propName movie}.
		<ul>
			<li>id: {ExtVideo:id extVideo}</li>
			<li>duration: {ExtVideo:duration extVideo}</li>
			<li>aspect ratio: {ExtVideo:aspectRatio extVideo}</li>
		</ul>
	</div>
}