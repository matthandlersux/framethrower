// preparse(mainTemplate);

// desugarFetch(mainTemplate);


//var compiledTemplate = makeClosure(mainTemplate, base.env);

var cell;

function send(string) {
	cell = session.query(parseExpr(string));
	session.flush();
	cell.inject(function() {}, function(val) {
		console.log("Got val:", val, " for expr: ", string);
	});
}


function initialize() {
	//Get shared lets from server and insert them into the environment
	// session.getSharedLets(function (sharedLets) {
	// 	var sharedEnv = extendEnv(base.env, sharedLets);
	// 
	// 	var compiledTemplate = evaluate(makeClosure(mainTemplate, sharedEnv));
	// 
	// 	var node = xmlToDOM(compiledTemplate.xml, compiledTemplate.env);
	// 
	// 	document.body.appendChild(node.node);
	// 
	// 	document.body.focus();		
	// });
}