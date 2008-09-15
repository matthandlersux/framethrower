(function () {
	
	// =========================================================
	// "Preferences"
	// =========================================================
	
	var longDownTime=600;
	var longHoverTime=2500;
	var longDraggingHoverTime=480;

	// http://developer.apple.com/documentation/UserExperience/Conceptual/OSXHIGuidelines/XHIGDragDrop/chapter_12_section_5.html
	var dragRadius=3;
	

	// =========================================================
	// Processing Events
	// =========================================================
	
	function processEvent(eventName, e) {
		// go up
		var button;
		var at = e.target;
		while (at) {
			if (at.bindingButtonName) {
				button = at.bindingButtonName;
			}
			if (at.bindingURL) {
				//console.log(at.bindingURL, button);
				var bindingXML = documents.get(at.bindingURL);
				var trans = xpath("f:transaction[@event='" + eventName + "' and (not(@button) or @button = '" + button + "')]", bindingXML);
				if (trans.length > 0) {
					var transName = trans[0].getAttributeNS("", "name");
					processPerforms(makeAmbient(), null, null, null, null, at.bindingURL + "#" + transName, at.bindingParams);
				}
				return;
			}
			at = at.parentNode;
		}
	}
	
		
	// =========================================================
	// Copying Events
	// =========================================================
	
	var eventPropertiesToCopy = ["target", "clientX", "clientY", "button", "detail", "charCode", "keyCode", "altKey", "ctrlKey", "metaKey", "shiftKey"];
	function copyEvent(e) {
		var ret = {};
		forEach(eventPropertiesToCopy, function (prop) {
			ret[prop] = e[prop];
		});
		return ret;
	}
	
	// =========================================================
	// Event Logic
	// =========================================================
	
	var mouseIsDown = false;
	var mouseIsDragging = false;
	var mouseDownPos = [0,0];
	
	function mousedown(e) {
		mouseIsDown = copyEvent(e);
		dont(e);
	}
	function mouseup(e) {
		if (mouseIsDragging) {
			processEvent("dragEnd", e);
		} else {
			processEvent("click", mouseIsDown);
			mouseIsDown = false;
			mouseIsDragging = false;
		}
		
	}
	function mousemove(e) {
		
	}
	function mouseover(e) {
		
	}
	function mouseout(e) {
		
	}
	function mousescroll(e) {
		
	}
	
	function dont(e) {
		e.preventDefault();
	}
	
	document.addEventListener("mousedown", mousedown, true);
	document.addEventListener("mouseup", mouseup, true);
	document.addEventListener("mousemove", mousemove, true);
	document.addEventListener("mouseover", mouseover, true);
	document.addEventListener("mouseout", mouseout, true);
	document.addEventListener("DOMMouseScroll", mousescroll, true);
})();