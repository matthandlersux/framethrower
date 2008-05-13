
// localIds.get() returns a unique Id string
var localIds = function () {
	var count = 0;
	return {
		get: function () {
			count++;
			return "local." + count;
		}
	};
}();


function genString(fromId, typeId, toId) {
	return fromId + "," + typeId + "," + toId;
}

function genAllStrings(fromId, typeId, toId) {
	return [
		genString(fromId, typeId, toId),
		genString(null, typeId, toId),
		genString(fromId, null, toId),
		genString(fromId, typeId, null),
		genString(null, null, toId),
		genString(null, typeId, null),
		genString(fromId, null, null)
	];
}


/*
Messages is an array,
	where each entry is an object with keys ask and query
		ask is the process to be asked
		query is the question to ask the process
		(If ask is null, the response is automatically null.)
When all the responses are in, callback is called with the responses as arguments
	(At this point, whenever a response is updated, callback is called again)
*/
function getMultiple(messages, callback, callerId) {
	function callbackIfAllDone() {
		var allDone = true;
		var args = [];
		forEach(messages, function (message) {
			if (message.done) {
				args.push(message.response);
			} else {
				allDone = false;
			}
		});
		if (allDone) {
			// call callback with args
			callback.apply(null, args);
		}
	}
	
	forEach(messages, function (message) {
		if (message.ask) {
			message.ask.get(message.query, function (response) {
				message.response = response;
				message.done = true;
				callbackIfAllDone();
			}, callerId);
		} else {
			message.response = null;
			message.done = true;
		}
	});
	
	callbackIfAllDone();
}




function makeProcess() {
	var hash = {};
	var id = localIds.get();
	var content = null;
	var contentInforms = [];
	
	return {
		
		get: function (query, callback, callerId) {
			if (query.q === "id") {
				callback(id);
			} else if (query.q === "content") {
				if (callerId) {
					contentInforms[callerId] = callback;
				}
				callback(content);
			} else if (query.q === "link") {
				getMultiple(
					[
						{ask: query.from, query: {q: "id"}},
						{ask: query.type, query: {q: "id"}},
						{ask: query.to, query: {q: "id"}}
					], function (fromId, typeId, toId) {
						var queryString = getString(fromId, typeId, toId);

						var hashEntry = hash[queryString];
						if (!hashEntry) {
							hashEntry = {links: {}, informs: {}};
							hash[queryString] = hashEntry;
						}
						
						if (callerId) {
							hashEntry.informs[callerId] = callback;
						}

						callback(hashEntry.links);
					});
			}
		},

		register: function (link, from, type, to) {
			getMultiple(
				[
					{ask: link, query: {q: "from"}},
					{ask: link, query: {q: "type"}},
					{ask: link, query: {q: "to"}}])
			var allStrings = genAllStrings(link.getFrom(), link.getType(), link.getTo());
			forEach(allStrings, function (key) {
				if (!hash[key]) {
					hash[key] = {links: {}, informs: {}};
				}
				hash[key].links[link.getId()] = link;
				forEach(hash[key].informs, function (i) {
					inform(i, hash[key].links);
				});
			});
		}

	};
}


function makeLink(from, type, to, callback) {
	// check if link already exists
	from.get({q: "link", from: from, type: type, to: to}, function (links) {
		if (isEmpty(links)) {
			// link doesn't exist, so make it
			var link = makeProcess();
			var processGet = link.get;
			link.get = function (query, callback, callerId) {
				if (query.q === "from") {
					callback(from);
				} else if (query.q === "type") {
					callback(type);
				} else if (query.q === "to") {
					callback(to);
				} else if (query.q === "content") {
					// return XML...
				} else {
					processGet(query, callback, callerId);
				}
			};

			from.register(link);
			type.register(link);
			to.register(link);

			callback(link);
		} else {
			callback(links[0]);
		}
	});
}

function makeTransform() {
	// ...
}


