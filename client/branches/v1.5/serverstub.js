/**
 * @author boobideedoobop
 */

var serverStub = function () {

	var serverProcessHash = [];
	
	var serverIds = function () {
		var count = 0;
		return {
			get: function () {
				count++;
				return "server" + count;
			}
		};
	}();
	

	function makeServerProcess(initContent) {
		var process = {};
		
		var id;
		process.getId = function () {
			return id;
		};
		
		/*
		hash and callbacks take as keys query strings
		*/
		var callbacks = {};
		var hash = {};
	
		/*
		updates all listeners of a query to the new value of the query
		optionally takes a transform in which case only updates that transform
		*/
		function inform(query) {
			var qs = stringify(query);
			var answer = hash[qs];
			forEach(callbacks[qs], function (callback) {
				callback(answer);
			});
		}
		
	
		process.request = function (callback, query) {
			var qs = stringify(query);
			
			// add the transform to the informs record
			if (!callbacks[qs]) {
				callbacks[qs] = {};
			}
			informs[qs].push(callback);
			inform(query);
		};
		
		process.registerLink = function (query, link) {
			if (!hash[query]) {
				hash[query] = {};
			}
			hash[query][link.getId()] = link;
		};
	
		// debugging
		process.getHash = function () {
			return hash;
		};
		return process;
	}

	
	function createServerProcess(initContent, callback) {
		var serverProcess = makeServerProcess(initContent);
		callback(serverProcess.getId());
	}
	
	function makeServerLink(from, type, to) {
		var existLink = from.linkExists(from, type, to);
		if (existLink) return existLink;
		
		var link = makeServerProcess();
		link.getFrom = function () {
			return from;
		};
		link.getType = function () {
			return type;
		};
		link.getTo = function () {
			return to;
		};

		// register the link where appropriate
		from.registerLink(genLinkQuery(from, null, null), link);
		from.registerLink(genLinkQuery(from, type, null), link);
		from.registerLink(genLinkQuery(from, null, to), link);
		from.registerLink(genLinkQuery(from, type, to), link);
		
		type.registerLink(genLinkQuery(null, type, null), link);
		
		to.registerLink(genLinkQuery(null, type, to), link);
		to.registerLink(genLinkQuery(null, null, to), link);
		return link;
	}
	
	function createServerLink(fromServerId, typeServerId, toServerId, callback){
		var from = serverProcessHash[fromServerId];
		var linkExists = from.linkExists(from, type, to);
		if(linkExists){
			callback(linkExists.getId());
		}
		
		var type = serverProcessHash[typeServerId];
		var to = serverProcessHash[toServerId];
		var link = makeServerLink(from, type, to);
		var newLinkId = link.getId();
		serverProcessHash[newLinkId] = link;
		callback(newLinkId);
	}
	
	function getQueryFromServer(query, callback){
		var process;
		if (query.q === "content") {
			process = query.of;
		} else if (query.q === "links") {
			if (query.from) {
				process = serverProcessHash[query.from.getId()];
			}
			else if (query.to) {
				process = serverProcessHash[query.from.getId()];
			}
			else {
				process = serverProcessHash[query.from.getId()];
			}
		}
		process.request(callback, query);
	}
	
	return {
		createServerLink: createServerLink,
		createServerProcess: createServerProcess,
		getQueryFromServer: getQueryFromServer
	}
	
}

