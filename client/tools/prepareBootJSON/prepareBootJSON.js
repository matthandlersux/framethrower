//script to output basewords and basewords -> tooltip
//run command:
//java -jar ../util/js.jar builtin.js

var generateFiles = function () {
	var baseObjects = base.debug();

	//generate bootJSON file to be used by server

	var rootObjects = {};
	var rootExprs = {};
	forEach(baseObjects, function (object, name) {
		if (object.kind === "object") {
			rootObjects[name] = unparseType(object.type);
		} else if (object.kind === "fun") {
			//ignore primFuncs (they are shared already)
		} else if (object.kind === "exprLambda" || object.kind === "exprApply") {
			rootExprs[name] = stringify(object);
		} else {
			// ignore things like null, ord, list
		}
	});

	//build bootJSON object
	var bootJSON = {};

	//TODO: should we add classesToMake to the 'base' object?
	bootJSON.classes = classesToMake; //classesToMake defined in builtin/classes.js

	bootJSON.rootObjects = rootObjects;
	bootJSON.exprLib = rootExprs;
	bootJSON.sharedLet = mainTemplate.sharedLet;

	var bootJSONString = JSON.stringify(bootJSON);

	try {
		writeStringToFile(ROOTDIR + "../server/pipeline/priv/bootJSON", bootJSONString);
		print('success');
	} catch (e) {
		console.log("Running from browser, so not writing bootJSON: ", bootJSON);
	}
};


function include (bundles, extraFiles) {
	ROOTDIR = "../../";
	load(ROOTDIR + "tools/util/java.js");
	load(ROOTDIR + "source/js/include.js");
	includes.rhinoInclude(bundles, extraFiles);
}

//MAIN
//RUN COMMAND:
//java -jar ../util/js.jar -opt -1 prepareBootJSON.js <root folder>

try {
	if(arguments.length > 0 ) {
		var templateFile = "../../generated/templates/" + arguments[0] + ".js";
		include(["core"], [templateFile]);
		generateFiles();
	} else {
		print( 'usage: js.jar prepareBootJSON.js <root folder>' );
	}
} catch (e) {
	//running in browser
}