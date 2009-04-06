function getPosition(node) {
	//changed getPosition so it will handle the weird bugginess of offsetParent seen in firefox
	var obj = node;
	
	var curleft = curtop = 0;

	var recurse = function() {
		if(obj.offsetParent !== undefined && obj.offsetParent !== null) {
			curleft += obj.offsetLeft - obj.scrollLeft;
			curtop += obj.offsetTop - obj.scrollTop;
			obj = obj.offsetParent;
			recurse();
		} else if(obj.parentNode !== undefined && obj.parentNode !== null) {
			obj = obj.parentNode;
			recurse();
		}
	};
	recurse();
	
	return [curleft, curtop];
}