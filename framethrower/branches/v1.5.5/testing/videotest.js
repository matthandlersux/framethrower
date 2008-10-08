
var mainAmbient = makeAmbient();

var embedVideo = layout.embedVideo.make();

var videoTimeline = layout.videoTimeline.make();
videoTimeline.control.embedVideo.set(embedVideo);

videoTimeline.control.src.set("file:///Users/tschachman/Desktop/Singin%27%20in%20the%20Rain-Low.mp4");
videoTimeline.control.aspect.set(1.2958);
videoTimeline.control.duration.set(6163.96);

processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {
	 videoTimeline: videoTimeline /*,
	"uiStartCaps.windowSizeWidth": uiStartCaps.windowSizeWidth,
	"uiStartCaps.windowSizeHeight": uiStartCaps.windowSizeHeight*/
}, "");


//var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("mouse x"), uiStartCaps.mousePositionX);
//var ec = makeSimpleEndCap(mainAmbient, endCaps.log.unit("mouse y"), uiStartCaps.mousePositionY);

/*var test = deriveForEach(rw.get.childObjects(), function (o) {
	return o.get.parentSituation();
}, kernel.situation);*/

//var test = deriveNonEmpty(rw.get.childObjects());

//var test = deriveSort(rw.get.childObjects());
//var test2 = deriveLimit(test);

//var ec = makeSimpleEndCap(mainAmbient, endCaps.log.list("test output"), test2);