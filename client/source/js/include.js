var GLOBAL = {
	typeCheck: false // run-time type checking
};

var includes = (function () {
	var includeBundles = {
		core: [
			"source/js/external/json2.js",

			"source/js/util/debug.js",
			"source/js/util/util.js",
			"source/js/util/conSortedSet.js",

			"source/js/structure/constructors/constructors.js",
			"source/js/structure/constructors/parse.js",
			"source/js/structure/constructors/types.js",
			"source/js/structure/constructors/expr.js",
			"source/js/structure/constructors/literalTypes.js",

			"source/js/structure/objects.js",

			"source/js/structure/env.js",
			"source/js/structure/baseEnv.js",

			"source/js/structure/evaluate.js",

			"source/js/reactive/hash.js",
			"source/js/reactive/cells.js",
			"source/js/reactive/ranges.js",
			"source/js/reactive/controlledCell.js",

			"source/js/builtin/builtin.js",
			"source/js/builtin/functions/syntax.js",
			"source/js/builtin/functions/actions.js",
			"source/js/builtin/functions/null.js",
			"source/js/builtin/functions/ord.js",
			"source/js/builtin/functions/tuple.js",
			"source/js/builtin/functions/list.js",
			"source/js/builtin/functions/utility.js",
			"source/js/builtin/functions/cells.js",
			"source/js/builtin/functions/serialize.js",
			"source/js/builtin/exprs.js",
			"source/js/builtin/classes.js",
			"source/js/builtin/rootObjects.js",
			"source/js/builtin/eventExtras.js",



			"source/js/remote/remote.js",
			
			"source/js/templates/preparse.js", // might want to do this at compile time?
			"source/js/templates/fetch.js"
		],
		browser: [
			"source/js/external/firebugx.js",
			"source/js/external/XMLHttpRequest.1.0.3/XMLHttpRequest.js",

			"source/js/browser/xml.js",
			"source/js/browser/position.js",
			"source/js/browser/style.js",

			"source/js/templates/funs.js",
			"source/js/templates/action.js",
			"source/js/templates/closure.js",
			"source/js/templates/writexml.js",

			"source/js/templates/events.js"
		]
	};

	function prepareIncludes(bundles, extraFiles) {
		function plusRootDir(a) {
			var ret = [];
			for (var i = 0, len = a.length; i < len; i++) {
				ret.push(ROOTDIR + a[i]);
			}
			return ret;
		}

		var includes = [];
		for (var i = 0, len = bundles.length; i < len; i++) {
			includes = includes.concat(plusRootDir(includeBundles[bundles[i]]));
		}
		includes = includes.concat(extraFiles);
		return includes;
	}

	
	return {
		htmlInclude: function (bundles, extraFiles, onLoadString) {
			var includes = prepareIncludes(bundles, extraFiles);
			
			YAHOO.util.Get.script(includes, { 
				onSuccess: function () {eval(onLoadString);}
			});
		},
		
		rhinoInclude: function (bundles, extraFiles) {
			var includes = prepareIncludes(bundles, extraFiles);
			for (var i = 0, len = includes.length; i < len; i++) {
				load(includes[i]);
			};
		}
	};
})();