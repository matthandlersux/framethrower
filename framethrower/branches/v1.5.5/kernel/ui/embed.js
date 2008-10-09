var testGoto;

function processEmbed(ambient, node, ids, embed) {
	console.log("embedding");
	
	if (!embed) {
		embed = node;
	}
	
	var thunkEssence = getThunkEssence(embed, ids);
	
	var params = {};
	var paramNodes = xpath("f:with-param", embed);
	forEach (paramNodes, function(paramNode){
		params[paramNode.getAttributeNS("", "name")] = getObjectFromParam(paramNode, ids, {});
	});
	
	var mov = makeQTMovie(params["src"], params["width"], params["height"]);
	
	var embedVideo = params["embedVideo"];
	
	var gotoTime = embedVideo.get.gotoTime();
	
	var ec = makeSimpleEndCap(ambient, {
		set: function (time) {
			if (mov.SetTime) {
				mov.SetTime(time * mov.GetTimeScale());
			}
		}
	}, gotoTime);
	
	testGoto = embedVideo.control.gotoTime;
	
	node.parentNode.replaceChild(mov, node);
	
	function timeChanged() {
		embedVideo.control.currentTime.set(mov.GetTime() / mov.GetTimeScale());
		embedVideo.control.currentTime.PACKETCLOSE();
	}
	
	var playing = false;
	
	function keepTime() {
		timeChanged();
		if (playing) {
			setTimeout(keepTime, 100);
		}
	}
	
	mov.addEventListener("qt_timechanged", timeChanged, false);
	mov.addEventListener("qt_play", function () {
		console.log("playing");
		playing = true;
		//keepTime();
	}, false);
	mov.addEventListener("qt_pause", function () {
		console.log("paused");
		timeChanged();
		playing = false;
	}, false);
	
	mov.endCap = ec;
	mov.thunkEssence = thunkEssence;
}

function makeQTMovie(src, width, height) {
	var mov = document.createElementNS(xmlns["html"], "embed");
	
	function setAtt(name, value) {
		mov.setAttributeNS("", name, value);
	}
	setAtt("width", width);
	setAtt("height", height);
	setAtt("enablejavascript", "true");
	setAtt("postdomevents", "true");
	setAtt("scale", "aspect");
	setAtt("controller", "false");
	setAtt("autoplay", "false");
	
	//setAtt("src", src);
	setAtt("src", ROOTDIR+"images/dummy.mov");
	setAtt("qtsrc", src);
	setAtt("qtsrcdontusebrowser", "true");
	//src="dummy.mov" qtsrc="{@src}" qtsrcdontusebrowser="true"
	
	return mov;
	
	/*
	<html:embed id="mov" style="position:absolute;top:0px;left:0px;"
		width="400" height="300" enablejavascript="true" scale="aspect" controller="false" autoplay="false">
	*/
}


function testChangeTime(e) {
	testGoto.set(e.clientX);
}