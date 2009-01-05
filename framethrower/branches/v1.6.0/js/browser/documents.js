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
	req.send(null);
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
						// TODO: add support for xml includes
						
						
						
						urls[url] = req.responseXML.firstChild;
						forEach(callbacks[url], function (cb) {
							cb(urls[url]);
						});
						delete callbacks[url];
					});					
				} else {
					callbacks[url].push(callback);					
				}
			}
		},
		preload: function (url) {
			
		}
	};
})();

/*var xmlTemplates = (function () {
	var urls = {};
	
	return {
		withTemplate: function (url, callback) {
			if (urls[url]) {
				callback(urls[url]);
			} else {
				documents.withDoc(url, function (xml) {
					
					var xmlincludexsl = xpath("f:includexsl", xml);
					var funcs = [];
					forEach(xmlincludexsl, function (inc) {
						var includeUrl = urlToAbs(url, getAttr(inc, "url"));
						funcs.push(function (callback) {
							documents.withDoc(includeUrl, function (doc) {
								forEach(xpath("*", doc), function (x) {
									xml.ownerDocument.adoptNode(x);
									xml.appendChild(x); // BROWSER
								});
								callback();
							});
						});
					});
					
					parallelCallback(funcs, function () {
						urls[url] = makeXMLTemplate(xml, url);
						callback(urls[url]);							
					});
					
				});
			}
		},
		preload: function (url) {
			
		}
	};
})();*/


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