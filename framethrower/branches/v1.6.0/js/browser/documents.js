/*
An XMLTemplate looks like:
{
	kind: "xmlTemplate",
	paramList: [String],
	url: String,
	fun: Fun
}
*/

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
	
	return {
		withDoc: function (url, callback) {
			if (urls[url]) {
				callback(urls[url]);
			} else {
				asyncRequest(ROOTDIR+url, function (req) {
					urls[url] = req.responseXML.firstChild;
					callback(urls[url]);
				});
			}
		},
		preload: function (url) {
			
		}
	};
})();

var xmlTemplates = (function () {
	var urls = {};
	
	return {
		withTemplate: function (url, callback) {
			if (urls[url]) {
				callback(urls[url]);
			} else {
				documents.withDoc(url, function (xml) {
					urls[url] = {

					};
					callback(urls[url]);
				});
			}
		},
		preload: function (url) {
			
		}
	};
})();



