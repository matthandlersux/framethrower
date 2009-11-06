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

function perform(string) {
	var callback = function (result) {
		console.log("Action Result:", result, "for action: ", string);	
	};
	executeAction(evaluate(parseExpr(string, testSharedEnv)), callback);
}


function getRemoteActions (sharedLet) {
	var remoteActions = {};
	
	forEach(sharedLet, function(let, name) {
		if (let.kind === "lineTemplate") {
			//this let is an action
			var actionFunction = function() {
				//have to convert arguments into another array because arguments is not a real array (javascript quirk)
				var args = Array.prototype.slice.call(arguments);
				return makeRemoteInstruction(name, args);
			}
			remoteActions[name] = makeFun(let.type, actionFunction, let.params.length, name, remote.localOnly, true);
		}
	});

	return remoteActions;
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
		session.getSharedLets(function(sharedLets) {
			//add remote actions to sharedLets
			var remoteActions = getRemoteActions(mainTemplate.sharedLet)
			var sharedEnv = extendEnv(base.env, remoteActions);
			sharedEnv = extendEnv(sharedEnv, sharedLets);
			testSharedEnv = sharedEnv;
			initMainTemplate(sharedEnv);
		});
	}
}