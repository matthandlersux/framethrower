var layout = scaffold({
	pane: {
		paneSet: {},
		viewer: {}
	},
	zui: {}
}, "layout");

layout.zui.prop = {
	focus: interfaces.unit(kernel.situation),
	properties: interfaces.unit(basic.xml),
	expandedChildren: interfaces.set(layout.zui)
};