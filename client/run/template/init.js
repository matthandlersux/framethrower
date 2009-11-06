// preparse(mainTemplate);

// desugarFetch(mainTemplate);


//var compiledTemplate = makeClosure(mainTemplate, base.env);


function initialize() {
	function initMainTemplate (env) {
		var compiledTemplate = evaluate(makeClosure(mainTemplate, env));

		var node = xmlToDOM(compiledTemplate.xml, compiledTemplate.env);

		document.body.appendChild(node.node);

		document.body.focus();		
	}
	
	if (LOCAL) {
		initMainTemplate(base.env);
	} else {
		//Get shared lets from server and insert them into the environment
		session.getSharedLets(function(sharedLets) {
			//add remote actions to sharedLets
			var remoteActions = getRemoteActions(mainTemplate.sharedLet)
			var sharedEnv = extendEnv(base.env, remoteActions);
			sharedEnv = extendEnv(base.env, sharedLets);
			initMainTemplate(sharedEnv);
		});
	}
}