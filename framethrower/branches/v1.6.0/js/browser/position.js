function getPosition(node) {
	var obj = node;
	
	var curleft = curtop = 0;
	do {
		curleft += obj.offsetLeft - obj.scrollLeft;
		curtop += obj.offsetTop - obj.scrollTop;
	} while (obj = obj.offsetParent);
	
	return [curleft, curtop];
}