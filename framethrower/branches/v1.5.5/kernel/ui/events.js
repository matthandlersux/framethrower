(function () {
	
	// =========================================================
	// "Preferences"
	// =========================================================
	
	var longDownTime=600;
	var longHoverTime=2500;
	var longDraggingHoverTime=480;

	// http://developer.apple.com/documentation/UserExperience/Conceptual/OSXHIGuidelines/XHIGDragDrop/chapter_12_section_5.html
	var dragRadius=3;
	var currentFocus=null;

	// =========================================================
	// Processing Events
	// =========================================================
	
	function processEvent(eventName, e, eventParams) {
		
		// go up
		var button;
		var at = e.target;
		while (at) {
			if (!button && at.bindingButtonName) {
				button = at.bindingButtonName;
			}
			if (at.bindingURL) {
				//console.log(at.bindingURL, button);
				var bindingXML = documents.get(at.bindingURL);
				var trans = xpath("f:transaction[@event='" + eventName + "' and (not(@button) or @button = '" + button + "')]", bindingXML);
				if (trans.length > 0) {
					
					var eventXML = document.createElementNS("","eventXML");
					if (eventParams) {
						var clientRect = e.target.getBoundingClientRect();
						eventParams["boundingLeft"] = clientRect.left;
						eventParams["boundingTop"] = clientRect.top;
						eventParams["boundingRight"] = clientRect.right;
						eventParams["boundingBottom"] = clientRect.bottom;
						
						forEach(eventParams, function(param, name) {
							eventXML.setAttribute(name, param);
						});
					}
					
					var transName = trans[0].getAttributeNS("", "name");
					var inputParams = at.bindingParams;
					inputParams.eventXML = startCaps.unit(eventXML);
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
		if (currentFocus && currentFocus.blur) {
			var tmp = currentFocus;
			currentFocus=false;
			tmp.blur();
		}		
		if(e.target.localName != 'input'){
			dont(e);
		}
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
		processEvent("mousemove", e, {clientX: e.clientX, clientY: e.clientY});
	}
	function mouseover(e) {
		processEvent("mouseover", e);
	}
	function mouseout(e) {
		processEvent("mouseout", e);
	}
	function mousescroll(e) {
		
	}
	function focus(e) {
		currentFocus=e.target;
		processEvent("focus", e);
	}
	function blur(e) {
		processEvent("blur", e, {value:e.target.value});
		if (!currentFocus) processEvent("manualblur", e);
	}	
	function change(e) {
		processEvent("change", e, {value:e.target.value});
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
	document.addEventListener("blur",blur,true);
	document.addEventListener("focus",focus,true);
	document.addEventListener("change",change,true);
})();