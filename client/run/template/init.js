// preparse(mainTemplate);

// desugarFetch(mainTemplate);


//var compiledTemplate = makeClosure(mainTemplate, base.env);


function initialize() {
	//Get shared lets from server and insert them into the environment
	session.getSharedLets(function (sharedLets) {
		console.log("Got shared lets", sharedLets);
		var sharedEnv = addLets(sharedLets, base.env);

		var compiledTemplate = evaluate(makeClosure(mainTemplate, sharedEnv));


		var node = xmlToDOM(compiledTemplate.xml, compiledTemplate.env);

		document.body.appendChild(node.node);

		document.body.focus();		
	});
}