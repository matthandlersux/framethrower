// preparse(mainTemplate);

// desugarFetch(mainTemplate);


//var compiledTemplate = makeClosure(mainTemplate, base.env);


function initialize() {
	//Get shared lets from server and insert them into the environment
	function initMainTemplate (sharedLets) {
		var sharedEnv = extendEnv(base.env, sharedLets);

		var compiledTemplate = evaluate(makeClosure(mainTemplate, sharedEnv));

		var node = xmlToDOM(compiledTemplate.xml, compiledTemplate.env);

		document.body.appendChild(node.node);

		document.body.focus();		
	}
	
	if (LOCAL) {
		initMainTemplate({});
	} else {
		session.getSharedLets(initMainTemplate);	
	}
}