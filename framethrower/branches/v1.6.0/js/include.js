(function () {
	
	var includes = [
		"js/util/debug.js",
		"js/util/util.js",
		"js/util/xml.js",
		"js/util/conSortedSet.js",

		"js/structure/parse.js",
		"js/structure/env.js",
		"js/structure/types.js",
		"js/structure/expr.js",

		"js/structure/baseEnv.js",

		"js/structure/stringify.js",
		"js/structure/evaluate.js",

		"js/reactive/hash.js",
		"js/reactive/primfuncscells.js",
		"js/reactive/cells.js",
		"js/reactive/ranges.js",
		"js/reactive/controlledCell.js",

		"js/browser/xsl.js",
		"js/browser/documents.js",
		"js/browser/convertExprXML.js",
		"js/browser/evalThunk.js",
		"js/browser/replaceXML.js"
		
	];
	
	var len = includes.length;
	for (var i = 0; i < len; i++) {
		includes[i] = ROOTDIR + includes[i];
	}
	
	len = INCLUDES.length;
	for (var i = 0; i < len; i++) {
		includes.push(INCLUDES[i]);
	}
	
	YAHOO.util.Get.script(includes, { 
		onSuccess: function () {eval(ONLOAD);}
	});
	
})();
