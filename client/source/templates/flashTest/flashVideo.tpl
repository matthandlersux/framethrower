function (width::Number, height::Number, src::String, playTime::Unit Number, play::Unit Null)::XMLP {
	
	function makeFlashMovie(src, width, height) {
		var mov = createEl("embed");
		
		function setAtt(name, value) {
			setAttr(mov, name, value);
		}
		
		setAtt("allowScriptAccess", "always");
		
		setAtt("width", width);
		setAtt("height", height);
		
		setAtt("src", "main.swf");
		setAtt("name", "dummyName");
		setAtt("id", "dummyName");
		setAtt("quality", "high");
		setAtt("play", "true");
		
		setAtt("type", "application/x-shockwave-flash");
		setAtt("pluginspage", "http:/"+"/www.adobe.com/go/getflashplayer");
		
		return mov;
	}
	
	
	var mov = makeFlashMovie(src, width, height);
	
	var cleanupFuncs = [];
	
	var playTimeInject = evaluateAndInject(playTime, emptyFunction, function (time) {
		mov.setPlayTime(time);
	});
	cleanupFuncs.push(playTimeInject.unInject);
	
	var playInject = evaluateAndInject(play, emptyFunction, function () {
		mov.setPlay(true);
		return function () {
			mov.setPlay(false);
		}
	});
	
	
	
	
	// // this just caches mov.GetTimeScale()
	// var timeScale;
	// function getTimeScale() {
	// 	// if (timeScale === undefined) {
	// 	// 	try {
	// 	// 		timescale = mov.GetTimeScale();
	// 	// 	} catch (e) {
	// 	// 		
	// 	// 	}
	// 	// }
	// 	// return timeScale;
	// 	return mov.GetTimeScale();
	// }
	// 
	// var injectedFunc = evaluateAndInject(gotoTime, emptyFunction, function (time) {
	// 	try {
	// 		mov.SetTime(time * getTimeScale());
	// 	} catch (e) {
	// 		
	// 	}
	// });
	// 
	// cleanupFuncs.push(injectedFunc.unInject);
	// 
	// // mov.addEventListener("qt_progress", function () {
	// // 	var ts = getTimeScale();
	// // 	if (ts) {
	// // 		timeLoaded.control.add(mov.GetMaxTimeLoaded() / ts);			
	// // 	}
	// // }, true);
	
	
	function cleanup() {
		forEach(cleanupFuncs, function (f) {
			f();
		});
	}
	
	var ret = makeXMLP({node: mov, cleanup: cleanup});
	
	return ret;
}