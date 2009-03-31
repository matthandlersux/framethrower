

function processEmbed(node) {
	console.log("process embed called");
	if (xpath("html:embed", node).length === 0) {
		var te = node.custom.thunkEssence;
		var params = te.params;
	
		console.log("params", params);
	
		var mov = makeQTMovie(params["src"], params["width"], params["height"], params["autoplay"]);
		
		if (params["gotoTime"]) {
			// TODO: ask Andrew quickly about doneResponse (first arg to inject)
			var removeFunc = params["gotoTime"].inject(function () {}, function (time) {
				//console.log("I got the time", time);
				try {
					mov.SetTime(time * mov.GetTimeScale());
				} catch (e) {

				}
			}).func;

			node.custom.removeFunc = removeFunc;
		}
		
		appendChild(node, mov);
	}
}


function makeQTMovie(src, width, height, autoplay) {
	var mov = createEl("html:embed");
	
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
	
	/*
	<html:embed id="mov" style="position:absolute;top:0px;left:0px;"
		width="400" height="300" enablejavascript="true" scale="aspect" controller="false" autoplay="false">
	*/
}
