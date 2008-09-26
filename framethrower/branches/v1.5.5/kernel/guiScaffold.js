var layout = scaffold({
	pane: {
		paneSet: {},
		viewer: {}
	},
	zui: {},
	panelLayer: {}
}, "layout");

layout.zui.prop = {
	focus: interfaces.unit(kernel.ob),
	properties: interfaces.unit(basic.xml),
	childZuis: interfaces.set(layout.zui),
	expandedTypes: interfaces.set(kernel.individual),
	maximizedChild: interfaces.unit(layout.zui)
};

layout.panelLayer.prop = {
	properties: interfaces.unit(basic.xml),
	addFocus: interfaces.unit(kernel.ob)
};