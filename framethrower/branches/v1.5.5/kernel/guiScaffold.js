var layout = scaffold({
	pane: {
		paneSet: {},
		viewer: {}
	},
	zui: {}
}, "layout");

layout.zui.prop = {
	focus: interfaces.unit(kernel.situation),
	expandedChildren: interfaces.set(kernel.situation)
};