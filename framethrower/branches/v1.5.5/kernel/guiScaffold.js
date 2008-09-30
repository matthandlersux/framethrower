var layout = scaffold({
	pane: {
		paneSet: {},
		viewer: {}
	},
	zui: {},
	panelLayer: {},
	addPanel: {}
}, "layout");

layout.zui.prop = {
	focus: interfaces.unit(kernel.ob),
	properties: interfaces.unit(basic.xml),
	parentZui: interfaces.unit(layout.zui),
	childZuis: interfaces.list(layout.zui),
	expandedTypes: interfaces.set(kernel.individual),
	maximizedChild: interfaces.unit(layout.zui),
	minimized: interfaces.unit(basic.bool)
};

layout.panelLayer.prop = {
	properties: interfaces.unit(basic.xml),
	addFocus: interfaces.unit(kernel.ob)
};

layout.addPanel.prop = {
	properties: interfaces.unit(basic.xml)
};