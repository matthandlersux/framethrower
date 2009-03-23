var layout = scaffold({
	pane: {
		paneSet: {},
		viewer: {}
	},
	zui: {},
	panelLayer: {},
	addPanel: {},
	tooltip: {
		tooltipSituation: {}
	},
	
	video: {},
	embedVideo: {},
	videoTimeline: {}
}, "layout");

var outliner = scaffold({
	root: {},
	outline: {}
}, "outliner");

outliner.root.prop = {
	focus: interfaces.unit(kernel.ob),
	expanded: interfaces.unit(basic.bool),
	childOutline: interfaces.unit(outliner.outline)
};

outliner.outline.prop = {
	focus: interfaces.unit(kernel.ob),
	expandedChildren: interfaces.set(kernel.ob),
	childType: interfaces.unit(kernel.ob),
	childOutlines: interfaces.assoc(kernel.ob, outliner.outline)
};

layout.zui.prop = {
	focus: interfaces.unit(kernel.ob),
	properties: interfaces.unit(basic.xml),
	parentZui: interfaces.unit(layout.zui),
	childZuis: interfaces.list(layout.zui),
	expandedTypes: interfaces.set(kernel.individual),
	maximizedChild: interfaces.unit(layout.zui),
	minimized: interfaces.unit(basic.bool),
	viewWindow: interfaces.unit(basic.number),
	leftChildInView: interfaces.unit(basic.number),
	leftRailChild: interfaces.unit(basic.number)
};

layout.panelLayer.prop = {
	properties: interfaces.unit(basic.xml),
	addFocus: interfaces.unit(kernel.ob),
	addInfon: interfaces.unit(basic.bool),
	selectArg: interfaces.unit(basic.number),
	tooltip: interfaces.unit(layout.tooltip),
	videoTimelines: interfaces.list(layout.videoTimeline)
};

layout.tooltip.prop = {
	value: interfaces.unit(basic.string),
	color: interfaces.unit(basic.string)
};

layout.tooltipSituation.prop = {
	situation: interfaces.unit(kernel.situation)
};

layout.addPanel.prop = {
	properties: interfaces.unit(basic.xml),
	expanded: interfaces.unit(basic.bool),
	selectedRelation: interfaces.unit(kernel.relation),
	infonArgs: interfaces.assoc(basic.number, kernel.ob)
};


layout.video.prop = {
	src: interfaces.unit(basic.string),
	aspect: interfaces.unit(basic.number),
	duration: interfaces.unit(basic.number)
};

layout.embedVideo.prop = {
	currentTime: interfaces.unit(basic.number),
	gotoTime: interfaces.unit(basic.number),
	isPlaying: interfaces.unit(basic.bool)
};
layout.videoTimeline.prop = {
	video: interfaces.unit(layout.video),
	embedVideo: interfaces.unit(layout.embedVideo),
	zoomWidth: interfaces.unit(basic.number),
	selectedStartTime: interfaces.unit(basic.number),
	selectedEndTime: interfaces.unit(basic.number)
};