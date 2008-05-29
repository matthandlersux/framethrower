
var idGenerator = (function (prefix) {
	var count = 0;
	return {
		get: function () {
			count += 1;
			return prefix + count;
		}
	};
})("local.");

var objectCache = {};



function makeObject(content) {
	var o = {};
	
	var id = idGenerator.get();
	objectCache[id] = o;
	o.getId = function () {
		return id;
	};
	
	o.getContent = function () {
		return content;
	};
	o.setContent = function (newContent) {
		content = newContent;
		// propagate...
	};
	
	return o;
}


function makeRelation() {
	var relation = makeObject();
	
	var infons = {};
	
	function makeInfon(params) {
		var infon = makeObject({
			relation: relation,
			params: params
		});
		infon.xmlize = function () {
			var content = infon.getContent();
			// construct XML from content (relation and params)
		};
		return infon;
	}
	
	o.makeInfon = function (params) {
		var stringified = stringifyParams(params);
		var existing = infons[stringified];
		if (existing) {
			return existing;
		} else {
			var infon = makeInfon(params);
			infons[stringified] = infon;
			return infon;
		}
	};
	
	return o;
}




/*
constraint
	involves object
	relation object
	
*/





function stringifyParams(params) {
	var ret = "";
	var sorted = keys(params).sort();
	forEach(sorted, function (k) {
		ret += stringifyKeyValue(k, params[k].getId());
	});
}
function stringifyKeyValue(key, value) {
	return key + ":" + value;
}