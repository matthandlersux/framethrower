
// localIds.get() returns a unique Id
var localIds = function () {
	var count = 0;
	return {
		get: function () {
			count++;
			return "local" + count;
		}
	};
}();

function genString(from, type, to) {
	function maybeId(p) {
		if (p) {
			return p.getId();
		} else {
			return "";
		}
	}
	return "links," + maybeId(from) + "," + maybeId(type) + "," + maybeId(to);
}

function genAllLinkQueries(from, type, to) {
	function genQuery(from, type, to) {
		return {q: "links", from: from, type: type, to: to};
	}
	return [
		genQuery(from, type, to),
		genQuery(null, type, to),
		genQuery(from, null, to),
		genQuery(from, type, null),
		genQuery(null, null, to),
		genQuery(null, type, null),
		genQuery(from, null, null)
	];
}


function stringify(query) {
	if (query.q === "content") {
		return "content";
	} else if (query.q === "links") {
		return genString(query.from, query.type, query.to);
	}
}



function makeProcess(initContent, serverId) {
	var process = {};
	
	
	var id, local;
	if (serverId) {
		id = serverId;
		local = false;
	} else {
		id = localIds.get();
		local = true;
	}
	
	process.getId = function () {
		return id;
	};
	process.isLocal = function () {
		return local;
	};
	
	
	/*
	informs, hash, and serverHash take as keys query strings
	*/
	var informs = {};
	var hash = {};
	var serverHash = {};

	/*
	updates all listeners of a query to the new value of the query
	optionally takes a transform in which case only updates that transform
	*/
	function inform(query, transform) {
		var qs = stringify(query);
		var answer;
		if (query.q === "content") {
			answer = hash[qs];
		} else if (query.q === "links") {
			answer = merge(hash[qs], serverHash[qs]);
		}
		if (transform) {
			// inform the transform
		} else {
			forEach(informs, function (transform) {
				// inform the transform
			});
		}
	}
	

	process.request = function (transform, query) {
		var qs = stringify(query);
		
		// add the transform to the informs record
		if (!informs[qs]) {
			informs[qs] = {};
		}
		informs[qs][transform.getId()] = transform;
		
		// determine if the query should be answered locally
		var answerLocally;
		if (query.q === "content") {
			if (local) {
				answerLocally = true;
			} else {
				answerLocally = false;
			}
		} else if(query.q === "links") {
			if (
					(query.from && query.from.isLocal()) ||
					(query.type && query.type.isLocal()) ||
					(query.to && query.to.isLocal())
				) {
				answerLocally = true;
			} else {
				answerLocally = false;
			}
		}
		
		
		if (answerLocally || serverHash[qs]) {
			// notify the transform immediately
			inform(query, transform);
		} else {
			// request the query from the server
			getQueryFromServer(query, function (answer) {
				serverHash[qs] = answer;
				inform(query);
			});
		}
	};
	
	
	// I'm not done yet.....
	
	
	process.register = function (link) {
		var allQueries = genAllStrings(link.getFrom(), link.getType(), link.getTo());
		forEach(allQueries, function (qs) {
			if (!hash[qs]) {
				hash[qs] = {links: {}, informs: {}};
			}
			hash[qs].links[link.getId()] = link;
			process.inform(query);
		});
	};







	process.requestContent = function (transform) {
		
	};
	process.linkExists = function (from,type,to) {
		var query = genString(from,type,to);
		if (hash[query]) {
			return values(hash[query].links)[0];
		} else {
			return false;
		}
	};
	
	// debugging
	process.getHash = function () {
		return hash;
	};
	process.getContent = function () {
		return content;
	};
	
	return process;
}




function makeLink(from, type, to) {
	var existLink = from.linkExists(from, type, to);
	if (existLink) return existLink;
	
	var link = makeProcess();
	link.getFrom = function () {
		return from;
	};
	link.getType = function () {
		return type;
	};
	link.getTo = function () {
		return to;
	};
	// overrides process's getContent..
	link.getContent = function () {
		// return XML..
	};
	from.register(link);
	type.register(link);
	to.register(link);
	return link;
}

function makeTransform() {
	var transform = makeLink();
	// ...
}
