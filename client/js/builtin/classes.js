/*

An Object looks like:
{
	kind: "object",
	type: Type,
	origType: Type,
	prop: {propName:property}
}

*/


var classesToMake = {
	
	// ====================================================
	// New
	// ====================================================
	
	"Situation": {
		prop: {
			"container": "Unit Situation",
			"contains": "Set Situation",
			"propName": "Unit String", // these prop*s will be refactored!
			"propTime": "Unit Number",
			"propTimeline": "Unit Timeline",
			"pipesIn": "Set Pipe",
			"pipesOut": "Set Pipe"
		}
	},
	

	"Pipe": {
		prop: {
			"type": "Situation",
			"instance": "Situation",
			"container": "Map Ord Pipe",
			"contains": "Set Pipe",
			"truth": "Unit Number"
		}
	},
	
	
	"TimeSelection": {
		prop: {
			"start": "Unit Number",
			"duration": "Unit Number"
		}
	},
	
	"Timeline": {
		prop: {
			"duration": "Number",
			"video": "Unit X.video"
		}
	},
	
	
	// ====================================================
	// SV (Situation View)
	// ====================================================
	"Position": {
		prop: {
			"x": "Unit Number",
			"y": "Unit Number"
		}
	},	

	"ShapePosition": {
		prop: {
			"scale": "Unit Number",
			"position": "Position"
		}
	},

	"ChildProp": {
		prop: {
			"hidden": "Unit Null",
			"position": "Position",
			"scale": "Unit Number"
		}
	},
	
	
	
	
	
	
	
	
	
	// ====================================================
	// External Representations
	// ====================================================
	
	"X.video": {
		prop: {
			"url": "String",
			"width": "Number",
			"height": "Number",
			//"frameCount": "Number",
			"frameRate": "Number",
			"duration": "Number",
			"cuts": "Unit JSON"
		}
	},
	
	
	
	// ====================================================
	// UI
	// ====================================================
	
	"UI.ui": {
		prop: {
			"screenWidth": "Unit Number",
			"screenHeight": "Unit Number",
			"mouseX": "Unit Number",
			"mouseY": "Unit Number",
			"mouseDown": "Unit Null"
		}
	}
	

	
};

forEach(classesToMake, function (classDef, className) {
	objects.addClass(className, classDef);
});