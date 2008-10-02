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
	embedMovie: {}
}, "layout");

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
	tooltip: interfaces.unit(layout.tooltip)
};

layout.tooltip.prop = {
	value: interfaces.unit(basic.string),
	color: interfaces.unit(basic.string)
};

layout.tooltipSituation.prop = {
	situation: interfaces.unit(kernel.situation)
};

layout.addPanel.prop = {
	properties: interfaces.unit(basic.xml)
};

layout.embedMovie.prop = {
	currentFrame: interfaces.unit(basic.number),
	gotoFrame: interfaces.unit(basic.number),
	isPlaying: interfaces.unit(basic.bool)
};