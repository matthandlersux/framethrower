function getAllPosition(node) {
	var left = 0;
	var top = 0;
	var width = node.offsetWidth;
	var height = node.offsetHeight;
	var showing = true;
	
	var obj = node;
	
	while (obj !== null && obj !== undefined) {
		if (obj.offsetLeft !== undefined) {
			

			if (obj.style.overflow === "hidden") {

				if (left < 0) {
					width += left;
					left = 0;
				}
				if (top < 0) {
					height += top;
					top = 0;
				}
				if (left + width > obj.offsetWidth) {
					width = obj.offsetWidth - left;
				}
				if (top + height > obj.offsetHeight) {
					height = obj.offsetHeight - top;
				}
				
				if (width < 0 || height < 0) {
					showing = false;
					break;
				}
			}


				left += obj.offsetLeft - obj.scrollLeft;
				top += obj.offsetTop - obj.scrollTop;

		}
		
		if (obj.offsetParent !== undefined) {
			obj = obj.offsetParent;
		} else {
			obj = obj.parentNode;
		}
	}
	
	
	
	// if (width <= 0 || height <= 0) {
	// 	showing = false;
	// }
	
	return [showing, left, top, width, height];
}











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

function getRelativePosition(node, ancestor) {
	var obj = node;
	
	var curleft = curtop = 0;

	var recurse = function() {
		if(obj !== null && obj !== undefined && obj !== ancestor) {
			if(obj.offsetLeft !== undefined) {
				curleft += obj.offsetLeft - obj.scrollLeft;
				curtop += obj.offsetTop - obj.scrollTop;
			}
			obj = obj.parentNode;
			recurse();
		}
	};
	recurse();
	
	if (obj!==ancestor)
		console.error("ancestor node not encountered");
	
	return [curleft, curtop];
}
