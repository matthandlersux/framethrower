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
		
		// var fon = xpath("(ancestor-or-self::*/f:on[@event='" + eventName + "'])[last()]", target);
		// 
		// var test = xpath("(ancestor-or-self::*/f:on[@event='" + eventName + "'])", target);
		// if (test.length > 1) {
		// 	console.log("multiple targets", test);
		// }
		
		
		// note the hackery here
		var fon = xpath("ancestor-or-self::*[f:on/@event='" + eventName + "' or f:wrapper/f:on/@event='" + eventName + "' or f:wrapper/f:wrapper/f:on/@event='" + eventName + "'][1]", target);
		
		if (fon.length > 0) {
			var fonEl = xpath("f:on[@event='" + eventName + "'] | f:wrapper/f:on[@event='" + eventName + "'] | f:wrapper/f:wrapper/f:on[@event='" + eventName + "']", fon[0])[0];
			
			
			// var browserParams = xpath("f:with-param-browser", fonEl);
			// var form;
			// forEach(browserParams, function (browserParam) {
			// 	var name = getAttr(browserParam, "name");
			// 	if (getAttr(browserParam, "form")) {
			// 		if (!form) {
			// 			form = xpath("ancestor-or-self::html:form[1]", fonEl);
			// 			if (form.length === 0) {
			// 				debug.error("f:on has a f:with-param-browser needing a form, but there's no form", fonEl);
			// 			}
			// 			form = form[0];
			// 		}
			// 		
			// 		var el = form.elements[getAttr(browserParam, "form")];
			// 		te.params[name] = "" + el.value;
			// 	} else if (getAttr(browserParam, "prop")) {
			// 		var prop = getAttr(browserParam, "prop");
			// 		if (prop === "mouseX") {
			// 			te.params[name] = mouseCurrentPos[0];
			// 		} else if (prop === "mouseY") {
			// 			te.params[name] = mouseCurrentPos[1];
			// 		} else if (prop === "relMouseX") {
			// 			//te.params[name] = mouseCurrentPos[0] - window.getComputedStyle(fon, null).getPropertyValue("left");
			// 			//console.log(getPosition(fonEl.parentNode));
			// 			te.params[name] = mouseCurrentPos[0] - getPosition(fonEl.parentNode)[0];
			// 		} else if (prop === "relMouseY") {
			// 			te.params[name] = mouseCurrentPos[1] - window.getComputedStyle(fon, null).getPropertyValue("top");
			// 		} else if (prop === "elemX") {
			// 			te.params[name] = getPosition(target)[0];
			// 		} else if (prop === "elemY") {
			// 			te.params[name] = getPosition(target)[1];
			// 		} else if (prop === "elemWidth") {
			// 			te.params[name] = target.offsetWidth;
			// 		} else if (prop === "elemHeight") {
			// 			te.params[name] = target.offsetHeight;
			// 		}
			// 		// TODO: add more here...
			// 	}
			// });
			
			var action = makeActionClosure(fonEl.custom.action, fonEl.custom.env);
			
			
			console.log("about to execute an action!", action);
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
	var mouseCurrentPos = [0,0]; // TODO fill this in everywhere below...
	
	function mousedown(e) {
		mouseIsDown = copyEvent(e);
		mouseDownPos = [e.clientX, e.clientY];
		processEvent("mousedown", e, {clientX: e.clientX, clientY: e.clientY});
		if (currentFocus && currentFocus.blur) {
			var tmp = currentFocus;
			currentFocus=false;
			tmp.blur();
		}		
		if (e.target.localName !== "input" && e.target.localName !== "button") {
			dont(e);
		}
	}
	function mouseup(e) {
		processEvent("mouseup", e);
		if (mouseIsDragging) {
			processEvent("dragEnd", e);
		} else {
			processEvent("click", mouseIsDown, {clientX: mouseIsDown.clientX, clientY: mouseIsDown.clientY});
		}
		mouseIsDown = false;
		mouseIsDragging = false;
	}
	function mousemove(e) {
		mouseCurrentPos[0] = e.clientX;
		mouseCurrentPos[1] = e.clientY;
		processEvent("mousemove", e, {clientX: e.clientX, clientY: e.clientY});
		if (mouseIsDown && !mouseIsDragging) {
			var xdiff=mouseDownPos[0]-e.clientX;
			var ydiff=mouseDownPos[1]-e.clientY;
			if (xdiff*xdiff + ydiff*ydiff >= dragRadius*dragRadius) {
				//console.log(mouseDownPos,e.clientX,e.clientY);
				mouseIsDragging = true;
				processEvent("dragStart", mouseIsDown);
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
	function submit(e) {
		var tmp = currentFocus;
		currentFocus=false;
		tmp.blur();
		dont(e);
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
	document.addEventListener("submit", submit, true);
})();



(function () {
	var ui = rootObjects["ui.ui"].prop;
	
	function resizeScreen(e) {
		//console.log("detected screen resize");
		var screenWidth = window.innerWidth;
		var screenHeight = window.innerHeight;
		ui["screenWidth"].control.add(screenWidth);
		ui["screenHeight"].control.add(screenHeight);
	}
	
	function mousemove(e) {
		ui["mouseX"].control.add(e.clientX);
		ui["mouseY"].control.add(e.clientY);
	}
	
	window.addEventListener("resize", resizeScreen, true);
	document.addEventListener("load", resizeScreen, true);
	
	document.addEventListener("mousemove", mousemove, true);
})();




























