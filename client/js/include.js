(function () {
	
	var includes = [
		"js/external/firebugx.js",
		"js/external/XMLHttpRequest.1.0.3/XMLHttpRequest.js",
		"js/external/json2.js",
		
		"js/util/debug.js",
		"js/util/util.js",
		"js/util/xml.js",
		"js/util/conSortedSet.js",
		
		"js/structure/constructors/constructors.js",
		
		"js/structure/constructors/parse.js",
		"js/structure/constructors/types.js",
		"js/structure/constructors/expr.js",
		
		"js/structure/constructors/literalTypes.js",

		"js/structure/env.js",
		"js/structure/baseEnv.js",
		
		"js/builtin/builtin.js",
		"js/builtin/functions/null.js",
		"js/builtin/functions/ord.js",
		"js/builtin/functions/utility.js",
		"js/builtin/functions/cells.js",
		"js/builtin/functions/serialize.js",
		"js/builtin/exprs.js",

		"js/structure/evaluate.js",

		"js/reactive/hash.js",
		"js/reactive/cells.js",
		"js/reactive/ranges.js",
		"js/reactive/controlledCell.js",
		
		"js/remote/remote.js",
		
		"js/objects/objects.js",
		"js/objects/rootObjects.js",
		
		
		"js/browser/position.js",
		
		"js/templates/preparse.js", // might want to do this at compile time?
		
		"js/templates/funs.js",
		"js/templates/action.js",
		"js/templates/closure.js",
		"js/templates/style.js",
		"js/templates/writexml.js",
		
		"js/templates/events.js"
		
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

