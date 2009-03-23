
var mainAmbient = makeAmbient();

var embedVideo = layout.embedVideo.make();

var singin = layout.video.make();
singin.control.src.set(ROOTDIR + "images/videos/Singin%27%20in%20the%20Rain-Lowest.mp4");
singin.control.aspect.set(1.2958);
singin.control.duration.set(6163.96);

var chairs = layout.video.make();
chairs.control.src.set("file:///Users/tschachman/Desktop/ted/ext/content/chairs.mov");
chairs.control.aspect.set(1.3333);
chairs.control.duration.set(41.2733);


var videoTimeline = layout.videoTimeline.make();
videoTimeline.control.embedVideo.set(embedVideo);

videoTimeline.control.video.set(singin);

videoTimeline.control.zoomWidth.set(15000);

processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {
	 videoTimeline: videoTimeline,
	"uiStartCaps.windowSizeWidth": uiStartCaps.windowSizeWidth,
	"uiStartCaps.windowSizeHeight": uiStartCaps.windowSizeHeight,
	"height": startCaps.unit(200)
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