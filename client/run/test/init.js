// preparse(mainTemplate);

// desugarFetch(mainTemplate);


//var compiledTemplate = makeClosure(mainTemplate, base.env);


var testSharedEnv;
var cell;

function send(string) {
	cell = session.query(parseExpr(string));
	session.flush();
	cell.inject(function() {}, function(val) {
		console.log("Got val:", val, " for expr: ", string);
	});
}

function sendAndRemove(string) {
	cell = session.query(parseExpr(string));
	session.flush();
	var cellMethods = cell.inject(function() {}, function(val) {
		console.log("Got val:", val, " for expr: ", string);
	});
	cellMethods.unInject();
}


function perform(string) {
	var callback = function (result) {
		console.log("Action Result:", result, "for action: ", string);	
	};
	executeAction(evaluate(parseExpr(string, testSharedEnv)), callback);
}


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
		session.getSharedLets(mainTemplate.sharedLet, function(sharedLets) {
			var sharedEnv = extendEnv(base.env, sharedLets);
			testSharedEnv = sharedEnv;
			initMainTemplate(sharedEnv);
			setTimeout(session.flush,0);
		});
	}
}