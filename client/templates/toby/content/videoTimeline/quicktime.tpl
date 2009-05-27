function (width::Number, height::Number, src::String) {
	
	function makeQTMovie(src, width, height, autoplay) {
		var mov = createEl("embed");

		function setAtt(name, value) {
			//mov.setAttributeNS("", name, value);
			setAttr(mov, name, value);
		}
		
		setAtt("width", width);
		setAtt("height", height);
		setAtt("enablejavascript", "true");
		setAtt("postdomevents", "true");
		setAtt("scale", "aspect");
		setAtt("controller", "false");

		if (autoplay) {
			setAtt("autoplay", "true");		
		} else {
			setAtt("autoplay", "false");
		}

		setAtt("src", src);
		//setAtt("src", ROOTDIR+"design/images/dummy.mov");
		//setAtt("qtsrc", src);
		//setAtt("qtsrcdontusebrowser", "true");
		//src="dummy.mov" qtsrc="{@src}" qtsrcdontusebrowser="true"
		
		return mov;

	}
	
	
	var mov = makeQTMovie(src, width, height, true);
	
	var ret = makeXMLP({xml: mov, cleanup: emptyFunction});
	
	console.log("made mov", ret);
	
	return ret;
	
	// console.log("process embed called");
	// if (xpath("html:embed", node).length === 0) {
	// 	var te = node.custom.thunkEssence;
	// 	var params = te.params;
	// 
	// 	console.log("params", params);
	// 
	// 	var mov = makeQTMovie(params["src"], params["width"], params["height"], params["autoplay"]);
	// 	
	// 	if (params["gotoTime"]) {
	// 		// TODO: ask Andrew quickly about doneResponse (first arg to inject)
	// 		var removeFunc = params["gotoTime"].inject(function () {}, function (time) {
	// 			//console.log("I got the time", time);
	// 			try {
	// 				mov.SetTime(time * mov.GetTimeScale());
	// 			} catch (e) {
	// 
	// 			}
	// 		}).func;
	// 
	// 		node.custom.removeFunc = removeFunc;
	// 	}
	// 	
	// 	appendChild(node, mov);
	// }
	
	
}