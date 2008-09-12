var layout = scaffold({
	pane: {
		paneSet: {},
		viewer: {}
	},
	zui: {}
}, "layout");

layout.zui.prop = {
	focus: interfaces.unit(kernel.ob),
	properties: interfaces.unit(basic.xml),
	childZuis: interfaces.set(layout.zui)
};