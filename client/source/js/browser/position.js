function getPosition(node) {
	//changed getPosition so it will handle the weird bugginess of offsetParent seen in firefox
	var obj = node;
	
	var curleft = curtop = 0;

	var recurse = function() {
		if(obj !== null && obj !== undefined) {
			if(obj.offsetLeft !== undefined) {
				if(obj.scrollTop > 0) {
					console.log(obj.scrollTop);
				}
				curleft += obj.offsetLeft - obj.scrollLeft;
				curtop += obj.offsetTop - obj.scrollTop;
			}
			if (obj.offsetParent !== undefined) {
				obj = obj.offsetParent;
				recurse();				
			} else {
				obj = obj.parentNode;
				recurse();
			}
		}
	};
	recurse();
	
	return [curleft, curtop];
}