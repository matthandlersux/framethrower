

function processEmbed(node) {
	console.log("process embed called");
	if (xpath("html:embed", node).length === 0) {
		var te = node.custom.thunkEssence;
		var params = te.params;
	
		console.log("params", params);
	
		var mov = makeQTMovie(params["src"], params["width"], params["height"]);
	
		// TODO: ask Andrew quickly about doneResponse (first arg to injectFunc)
		var removeFunc = params["gotoTime"].injectFunc(function () {}, function (time) {
			//console.log("I got the time", time);
			if (mov.SetTime) {
				mov.SetTime(time * mov.GetTimeScale());
			}
		}).func;
		
		node.custom.removeFunc = removeFunc;
		
		appendChild(node, mov);
	}
}


function makeQTMovie(src, width, height) {
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
	setAtt("autoplay", "false");
	
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
