
// localIds.get() returns a unique Id
var localIds = function () {
	var count = 0;
	return {
		get: function () {
			count++;
			return "local" + count;
		}
	}
}();

function genString(from, type, to) {
	var ret = "";
	if (from) {
		ret += from.getId();
	}
	ret += ",";
	if (type) {
		ret += type.getId();
	}
	ret += ",";
	if (to) {
		ret += to.getId();
	}
	return ret;
}

function genAllStrings(from, type, to) {
	var ret = [];
	ret.push(genString(from, type, to));
	ret.push(genString(null, type, to));
	ret.push(genString(from, null, to));
	ret.push(genString(from, type, null));
	ret.push(genString(null, null, to));
	ret.push(genString(null, type, null));
	ret.push(genString(from, null, null));
	return ret;
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
				var oneLinkSet = hash[query].links;
				var mylink;
				forEach(oneLinkSet, function(alink){
					mylink = alink;
				});
				return mylink;
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
	}
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
	}
	from.register(link);
	type.register(link);
	to.register(link);
	return link;
}

function makeTransform() {
	var transform = makeLink();
	// ...
}
