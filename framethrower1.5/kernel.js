
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
	return maybeId(from) + "," + maybeId(type) + "," + maybeId(to);
}

function genAllStrings(from, type, to) {
	return [
		genString(from, type, to),
		genString(null, type, to),
		genString(from, null, to),
		genString(from, type, null),
		genString(null, null, to),
		genString(null, type, null),
		genString(from, null, null)
	];
}



function makeProcess(initContent) {
	var hash = {};
	var id = localIds.get();
	var content = initContent;
	var informsContent = [];

	function inform(transform, links) {
		
	}
	function informContent(transform) {
		
	}
	
	return {
		getId: function () {
			return id;
		},
		register: function (link) {
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
		},
		request: function (transform, query) {
			// assuming query is one of those strings...
			if (!hash[query]) {
				hash[query] = {links: {}, informs: {}};
			}
			hash[query].informs[transform.getId()] = transform;

			// do the inform immediately, even though hasn't actually been a change...
			inform(transform, hash[query].links);
		},
		requestContent: function (transform) {
			
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
