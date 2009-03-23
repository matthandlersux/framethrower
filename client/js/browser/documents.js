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
						if (!req.responseXML) {
							debug.error("Invalid XML: "+url);
						}
						var xml = req.responseXML.firstChild;
						var xmlIncludes = xpath("descendant-or-self::f:include", xml);
						
						var funcs = [];
						forEach(xmlIncludes, function (include) {
							var includeUrl = urlToAbs(url, getAttr(include, "url"));
							funcs.push(function (callback) {
								documents.withDoc(includeUrl, function (doc) {
									forEach(xpath("*", doc), function (x) {
										//var imported = xml.ownerDocument.importNode(x, true);
										//xml.appendChild(imported); // BROWSER
										var imported = include.ownerDocument.importNode(x, true);
										include.parentNode.insertBefore(imported, include);
										//include.parentNode.replaceChild(imported, include);
									});
									include.parentNode.removeChild(include);
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
		preload: function (url, callback) {
			documents.withDoc(url, function (doc) {
				serverAdviceFromUrl(url);
				var urlNodes = xpath(".//f:thunk[@url] | .//f:with-template[@url]", doc);
				var funcs = [];
				forEach(urlNodes, function (urlNode) {
					var templateUrl = urlToAbs(url, getAttr(urlNode, "url"));
					if (!urls[templateUrl]) {
						funcs.push(function (callback) {
							documents.preload(templateUrl, callback);
						});
					}
				});
				parallelCallback(funcs, callback);
			});
		},
		debug: function () {
			return urls;
		}
	};
})();

// first argument is an array of functions, each of which takes a single parameter, a callback that is called when the function is "done".
// second argument is a callback. All funcs are executed and wait until they're all done, then this callback is called.
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