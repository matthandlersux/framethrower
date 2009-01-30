if (window.ROOTDIR === undefined) window.ROOTDIR = "";

function asyncRequest(url, callback) {
	var req = new XMLHttpRequest();
	
	req.open("GET", url, true);

	
	req.onreadystatechange = function () {
		if (req.readyState == 4) {
		 	if (req.status == 200 || req.status == 0) {
				callback(req);
			} else {
				console.error("XMLHttpRequest error", req.status, url, req);
			}
		}
	};
	try {
		req.send(null);
	} catch (e) {
		debug.error("Unable to open url `"+url+"`");
	}
}


var documents = (function () {
	var urls = {};
	var callbacks = {};
	
	return {
		withDoc: function (url, callback) {
			if (urls[url]) {
				callback(urls[url]);
			} else {
				if (!callbacks[url]) {
					callbacks[url] = [callback];
					asyncRequest(ROOTDIR+url, function (req) {
						var xml = req.responseXML.firstChild;
						var xmlIncludes = xpath("descendant-or-self::f:include", xml);
						
						var funcs = [];
						forEach(xmlIncludes, function (include) {
							var includeUrl = urlToAbs(url, getAttr(include, "url"));
							funcs.push(function (callback) {
								documents.withDoc(includeUrl, function (doc) {
									forEach(xpath("*", doc), function (x) {
										var imported = xml.ownerDocument.importNode(x, true);
										xml.appendChild(imported); // BROWSER
									});
									callback();
								});
							});
						});
						
						parallelCallback(funcs, function () {
							urls[url] = xml;
							forEach(callbacks[url], function (cb) {
								cb(xml);
							});
							delete callbacks[url];							
						});
						
					});					
				} else {
					callbacks[url].push(callback);					
				}
			}
		},
		preload: function (url) {
			
		},
		debug: function () {
			return urls;
		}
	};
})();


function parallelCallback(funcs, callback) {
	var count = funcs.length;
	if (count === 0) {
		callback();
	} else {
		function check() {
			count--;
			if (count === 0) {
				callback();
			}
		}
		forEach(funcs, function (func) {
			func(check);
		});
	}
}