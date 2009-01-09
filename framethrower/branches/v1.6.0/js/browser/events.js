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
		var target = e.target;
		
		var fon = xpath("ancestor-or-self::*/f:on[@event='" + eventName + "'][1]", target);
		
		if (fon.length > 0) {
			triggerAction(fon[0].custom.thunkEssence);
			refreshScreen();
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
		mouseDownPos = [e.clientX, e.clientY];
		processEvent("mousedown", e, {clientX: e.clientX, clientY: e.clientY});
		if (currentFocus && currentFocus.blur) {
			var tmp = currentFocus;
			currentFocus=false;
			tmp.blur();
		}		
		if (e.target.localName != 'input') {
			dont(e);
		}
	}
	function mouseup(e) {
		if (mouseIsDragging) {
			processEvent("dragEnd", e);
		} else {
			processEvent("click", mouseIsDown, {clientX: mouseIsDown.clientX, clientY: mouseIsDown.clientY});
		}
		mouseIsDown = false;
		mouseIsDragging = false;
	}
	function mousemove(e) {
		processEvent("mousemove", e, {clientX: e.clientX, clientY: e.clientY});
		if (mouseIsDown && !mouseIsDragging) {
			var xdiff=mouseDownPos[0]-e.clientX;
			var ydiff=mouseDownPos[1]-e.clientY;
			if (xdiff*xdiff + ydiff*ydiff >= dragRadius*dragRadius) {
				//console.log(mouseDownPos,e.clientX,e.clientY);
				mouseIsDragging = true;
				processEvent("dragStart", e);
			}
		}
		if (mouseIsDragging) {
			processEvent("mouseDrag", e, {clientX: e.clientX, clientY: e.clientY});
		}
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
	document.addEventListener("blur", blur, true);
	document.addEventListener("focus", focus, true);
	document.addEventListener("change", change, true);
})();