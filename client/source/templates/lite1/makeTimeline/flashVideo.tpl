function (src::String, playTime::Unit Number, play::Unit Number)::XMLP {
	
	function makeFlashMovie(src) {
		var mov = createEl("embed");
		
		function setAtt(name, value) {
			setAttr(mov, name, value);
		}
		
		setAtt("allowScriptAccess", "always");
		
		setAtt("width", "100%");
		setAtt("height", "100%");
		
		setAtt("src", "flashplayer/main.swf");
		setAtt("quality", "high");
		
		setAtt("flashvars", "server=192.168.1.115&source=moulinrouge");
		
		setAtt("type", "application/x-shockwave-flash");
		setAtt("pluginspage", "http:/"+"/www.adobe.com/go/getflashplayer");
		
		
		
		return mov;
	}
	
	
	var mov = makeFlashMovie(src);
	
	function trySetPlayTime(time) {
		try {
			mov.setPlayTime(time);
		} catch (e) {
			setTimeout(function () {trySetPlayTime(time);}, 250);
		}
	}
	
	
	
	
	
	var cleanupFuncs = [];
	
	var playStatus = 0;
	var poller;
	
	
	cleanupFuncs.push(evaluateAndInject(playTime, emptyFunction, function (time) {
		if (playStatus === 0) {
			trySetPlayTime(time);
		}
		return emptyFunction;
	}).unInject);
	
	cleanupFuncs.push(evaluateAndInject(play, emptyFunction, function (status) {
		playStatus = status;
		//console.log("setting playStatus", status);
		if (status === 0) {
			if (poller) clearInterval(poller);
			try {
				mov.setPlay(status);
			} catch (e) {};
		} else if (status === 1) {
			try {
				mov.setPlay(status);
			} catch (e) {};
			poller = setInterval(function () {
				movPlayStatus = mov.getPlay();
				if (movPlayStatus !== playStatus) {
					play.control.set(movPlayStatus);
				}
				if (movPlayStatus === 2) {
					playTime.control.set(mov.getPlayTime());
				}
			}, 250);
		}
		return emptyFunction;
	}).unInject);
	
	
	
	
	
	
	function cleanup() {
		forEach(cleanupFuncs, function (f) {
			f();
		});
	}
	
	var ret = makeXMLP({node: mov, cleanup: cleanup});
	
	return ret;
}