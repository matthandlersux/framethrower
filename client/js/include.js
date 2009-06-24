(function () {
	
	var structureIncludes = [
		"js/external/json2.js",
	
		"js/util/debug.js",
		"js/util/util.js",
		"js/util/conSortedSet.js",
	
		"js/structure/constructors/constructors.js",
		"js/structure/constructors/parse.js",
		"js/structure/constructors/types.js",
		"js/structure/constructors/expr.js",
		"js/structure/constructors/literalTypes.js",
		
		"js/structure/objects.js",

		"js/structure/env.js",
		"js/structure/baseEnv.js",

		"js/structure/evaluate.js",

		"js/reactive/hash.js",
		"js/reactive/cells.js",
		"js/reactive/ranges.js",
		"js/reactive/controlledCell.js",
	
		"js/builtin/builtin.js",
		"js/builtin/functions/null.js",
		"js/builtin/functions/ord.js",
		"js/builtin/functions/utility.js",
		"js/builtin/functions/cells.js",
		"js/builtin/functions/serialize.js",
		"js/builtin/exprs.js",
		"js/builtin/classes.js",
		"js/builtin/rootObjects.js",


	
		"js/remote/remote.js"
	
		
	];
	
	var browserIncludes = [
		"js/external/firebugx.js",
		"js/external/XMLHttpRequest.1.0.3/XMLHttpRequest.js",

		"js/browser/xml.js",
		"js/browser/position.js",
	
		"js/templates/preparse.js", // might want to do this at compile time?
	
		"js/templates/funs.js",
		"js/templates/action.js",
		"js/templates/closure.js",
		"js/templates/style.js",
		"js/templates/writexml.js",
	
		"js/templates/events.js"
	];
	
	var includes = [];
	
	function plusRootDir(a) {
		var ret = [];
		for (var i = 0, len = a.length; i < len; i++) {
			ret.push(ROOTDIR + a[i]);
		}
		return ret;
	}
	
	includes = includes.concat(plusRootDir(structureIncludes));
	if (!window.INCLUDESTRUCTUREONLY) includes = includes.concat(plusRootDir(browserIncludes));
	includes = includes.concat(INCLUDES);
	
	YAHOO.util.Get.script(includes, { 
		onSuccess: function () {eval(ONLOAD);}
	});
	
})();

