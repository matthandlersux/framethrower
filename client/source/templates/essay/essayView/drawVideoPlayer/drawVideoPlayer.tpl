template (video::ExtVideo, start::Number, duration::Number, displayWidth::Number) {
	displayHeight = plus 16 (quotient displayWidth (ExtVideo:aspectRatio video)),
	
	makeURL = function (id::String, start::Number, duration::Number)::String {
		return "http:/"+"/media.eversplosion.com/media.php?id=" + id + "&type=video&start=" + start + "&end=" + (start+duration);
		//return "http:/"+"/media.eversplosion.com/tmp/mr-video.mp4?start="+start+"&end="+(start+duration);
	},
	url = makeURL (ExtVideo:id video) start duration,
	
	<embed width="{displayWidth}" height="{displayHeight}" scale="aspect" controller="true" autoplay="true" src="{url}" />
}