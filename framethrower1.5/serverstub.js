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
		var hash = {};
		var id = serverIds.get();
		var content = initContent;
		var callbacksContent = [];
	
		function inform(callback, links) {
			
		}
		function informContent(callback) {
			
		}
		
		return {
			getId: function () {
				return id;
			},
			register: function (link) {
				var allStrings = genAllStrings(link.getFrom(), link.getType(), link.getTo());
				forEach(allStrings, function (key) {
					if (!hash[key]) {
						hash[key] = {links: {}, callbacks: []};
					}
					hash[key].links[link.getId()] = link;
					forEach(hash[key].callbacks, function (i) {
						inform(i, hash[key].links);
					});
				});
			},
			request: function (callback, query) {
				// assuming query is one of those strings...
				if (!hash[query]) {
					hash[query] = {links: {}, callbacks: []};
				}
				hash[query].callbacks.push(callback);
	
				// do the inform immediately, even though hasn't actually been a change...
				inform(callback, hash[query].links);
			},
			requestContent: function (callback) {
				
			},
			linkExists: function (from,type,to) {
				var query = genString(from,type,to);
				if (hash[query]) {
					return values(hash[query].links)[0];
				} else {
					return false;
				}
			},
			//just for testing
			getHash: function () {
				return hash;
			},
			//just for testing
			getContent: function () {
				return content;
			}
		};
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
		// overrides process's getContent..
		link.getContent = function () {
			// return XML..
		};
		from.register(link);
		type.register(link);
		to.register(link);
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
		var newLinkId = serverIds.get();
		serverProcessHash[newLinkId] = link;
		callback(newLinkId);
	}
	
	function serverQuery(query, serverId, callback){
		var process = serverProcessHash[serverId];
		process.request(callback, query);
	}
	
	return {
		createServerLink: createServerLink,
		createServerProcess: createServerProcess,
		serverQuery: serverQuery
	}
	
}

