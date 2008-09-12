JSTRANSFUNCS = {};


function test(args) {
	console.log(args.object1);
	var comment = document.createElementNS("","comment");
	return comment;
}



JSTRANSFUNCS.test = test;
