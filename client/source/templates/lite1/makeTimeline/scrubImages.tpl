template () {
	// this takes the current preview time and shows a frame image close to that
	
	// constants
	framesPerImage = 50,
	framesPerSecond = 0.1,
	
	// derived
	getClosestImage = function (time::Number)::(Number, Number) {
		var num = Math.floor(time * env("framesPerSecond"));
		var image = Math.floor(num / env("framesPerImage"));
		num = num - image*env("framesPerImage");
		return makeTuple2(image, num);
	},
	
	getUrl = function (imageNum::Number, id::String, width::Number, height::Number)::String {
		
		var framesPerImage = env("framesPerImage");
		
		var startImage = imageNum * framesPerImage;
		var endImage = (imageNum+1) * framesPerImage;
		
		var framesPerSecond = env("framesPerSecond");
		
		var times = [];
		for (var i = startImage; i < endImage; i++) {
			times.push(i / framesPerSecond);
		}
		
		var url = "url(http:/"+"/media.eversplosion.com/frames.php?id="+id+"&width="+width+"&height="+height+"&time=" + times.join(",") + ")";
		
		return url;
	},
	
	getBackgroundPosition = function (index::Number, height::Number)::String {
		return "0px -"+(index*height)+"px";
	},
	
	closestImage = getClosestImage previewTime,
	url = getUrl (fst closestImage) movieId scrubImageWidth scrubImageHeight,
	backgroundPosition = getBackgroundPosition (snd closestImage) scrubImageHeight,
	
	<div style-width="{scrubImageWidth}" style-height="{scrubImageHeight}" style-background-image="{url}" style-background-repeat="no-repeat" style-background-position="{backgroundPosition}">
		{getClosestImage previewTime} {url}
	</div>
}