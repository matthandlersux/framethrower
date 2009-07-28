template (video::ExtVideo, start::Number, duration::Number, displayWidth::Number) {
	displayHeight = plus 16 (quotient displayWidth (ExtVideo:aspectRatio video)),
	
	makeURL = function (id::String, start::Number, duration::Number)::String {
		//return "http:/"+"/media.eversplosion.com/media.php?id=" + id + "&type=video&start=" + start + "&end=" + (start+duration);
		return "http:/"+"/media.eversplosion.com/tmp/mr-video.mp4?start="+start+"&end="+(start+duration);
	},
	url = makeURL (ExtVideo:id video) start duration,
	makeQTMovie = function (src, width, height)::XMLP {
		var mov = createEl("embed");

		function setAtt(name, value) {
			setAttr(mov, name, value);
		}
		
		setAtt("width", width);
		setAtt("height", height);
		setAtt("enablejavascript", "true");
		setAtt("postdomevents", "true");
		setAtt("scale", "aspect");
		setAtt("controller", "true");
		setAtt("autoplay", "true");

		setAtt("src", src);
		//setAtt("src", ROOTDIR+"design/images/dummy.mov");
		//setAtt("qtsrc", src);
		//setAtt("qtsrcdontusebrowser", "true");
		//src="dummy.mov" qtsrc="{@src}" qtsrcdontusebrowser="true"
		
		return makeXMLP({node: mov, cleanup: null});

	},
	
	
	//makeQTMovie url 400 400
	<embed width="{displayWidth}" height="{displayHeight}" scale="aspect" controller="true" autoplay="true" src="{url}" />
}