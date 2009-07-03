(function () {
	
	function isDOMAncestor(child, grandparent) {
		if (!child) return false;
		else if (child === grandparent) return true;
		else return isDOMAncestor(child.parentNode, grandparent);
	}
	function DOMCommonAncestor(child1, child2) {
		var ancestors = [];
		while(child1) {
			ancestors.push(child1);
			child1 = child1.parentNode;
		}
		while(child2) {
			if (any(ancestors, function (ancestor) {
				return ancestor === child2;
			})) return child2;
			child2 = child2.parentNode;
		}
	}
	
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
	
	function processEvent(eventName, e, eventParams) {
		var target = e.target;
		
		if (!target) return;
		
		// var fon = xpath("(ancestor-or-self::*/f:on[@event='" + eventName + "'])[last()]", target);
		// 
		// var test = xpath("(ancestor-or-self::*/f:on[@event='" + eventName + "'])", target);
		// if (test.length > 1) {
		// 	console.log("multiple targets", test);
		// }
		
		function addWrappers(xp, or) {
			function repeat(s, n) {
				var ret = "";
				for (var i = 0; i < n; i++) {
					ret += s;
				}
				return ret;
			}
			var ret = xp;
			for (var i = 0; i < 10; i++) {
				
				ret += " "+or+" " + repeat("f:wrapper/", i)+xp + " "+or+" " + repeat("svg:g[not(@*)]/", i)+xp;
			}
			return ret;
			//return xp + " "+or+" f:wrapper/"+xp + " "+or+" svg:g/"+xp + " "+or+" f:wrapper/f:wrapper/"+xp + " "+or+" svg:g/svg:g/"+xp;
		}
		
		
		// note the hackery here
		var xpathExp = "ancestor-or-self::*[" + addWrappers("f:on/@event='" + eventName + "'", "or") + "][1]";
		
		var fon = xpath(xpathExp, target);
		
		if (fon.length > 0) {
			if (eventName === "mouseout") {
				var rt = e.relatedTarget;
				var commonAncestor = DOMCommonAncestor(target, rt);
				if (!isDOMAncestor(fon[0].parentNode, commonAncestor)) {
					return;
				}
			}
			
			var fonEls = xpath(addWrappers("f:on[@event='" + eventName + "']", "|"), fon[0]);
			
			forEach(fonEls, function (fonEl) {
				var env = function (s) {
					if (eventExtras[s]) {
						return eventExtras[s].f(e, fonEl.parentNode, mouseCurrentPos);
					} else {
						return fonEl.custom.env(s);
					}
				};
				
				var action = makeActionClosure(fonEl.custom.lineAction, env);

				//console.log("about to execute an action!", action);

				executeAction(action);
				
			});
			

			
			
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
	var mouseCurrentPos = [0,0];
	
	var mouseOverTarget = null;
	
	var currentFocus = null;
	
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
			//document.body.focus();
			//dont(e);
		}
	}
	function mouseup(e) {
		processEvent("mouseup", e);
		if (mouseIsDragging) {
			processEvent("dragend", e);
		} else {
			processEvent("click", mouseIsDown, {clientX: mouseIsDown.clientX, clientY: mouseIsDown.clientY});
		}
		mouseIsDown = false;
		mouseIsDragging = false;
	}
	function dblclick(e) {
		processEvent("dblclick", e); // TODO integrate this better?
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
				//console.log("doing dragstart");
				processEvent("dragstart", mouseIsDown);
			}
		}
		if (mouseIsDragging) {
			processEvent("mousedrag", e, {clientX: e.clientX, clientY: e.clientY});
		}
	}
	function mouseover(e) {
		//var oldTarget = mouseOverTarget;
		mouseOverTarget = e.target;
		// if (oldTarget) {
		// 	
		// }
		//console.log(mouseOverTarget, oldTarget);
		processEvent("mouseover", e);
	}
	function mouseout(e) {
		if (!isDOMAncestor(e.relatedTarget, e.target)) {
			processEvent("mouseout", e);
		}
	}
	function mousescroll(e) {
		processEvent("mousescroll", e);
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
	
	function keydown(e) {
		processEvent("keydown", e);
		console.log("key down happened", e.target);
	}
	function keyup(e) {
		processEvent("keyup", e);
	}
	function keypress(e) {
		processEvent("keypress", e);
	}
	
	function dont(e) {
		e.preventDefault();
	}
	
	document.addEventListener("mousedown", mousedown, true);
	document.addEventListener("mouseup", mouseup, true);
	document.addEventListener("dblclick", dblclick, true);
	document.addEventListener("mousemove", mousemove, true);
	document.addEventListener("mouseover", mouseover, true);
	document.addEventListener("mouseout", mouseout, true);
	document.addEventListener("DOMMouseScroll", mousescroll, true);
	document.addEventListener("mousewheel", mousescroll, true);
	document.addEventListener("blur", blur, true);
	document.addEventListener("focus", focus, true);
	document.addEventListener("change", change, true);
	document.addEventListener("submit", submit, true);
	
	document.addEventListener("keydown", keydown, true);
	document.addEventListener("keyup", keydown, true);
	document.addEventListener("keypress", keydown, true);
})();



// =========================================================
// Global UI Cells
// =========================================================

(function () {
	//var ui = rootObjects["ui.ui"].prop;
	var ui = base.env("ui.ui").prop;
	
	function onload() {
		document.body.focus();
		resizeScreen();
	}
	
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
	
	function mousedown(e) {
		ui["mouseDown"].control.add(nullObject);
	}
	function mouseup(e) {
		ui["mouseDown"].control.remove();
	}
	
	window.addEventListener("resize", resizeScreen, true);
	document.addEventListener("load", onload, true);
	
	document.addEventListener("mousemove", mousemove, true);
	document.addEventListener("mousedown", mousedown, true);
	document.addEventListener("mouseup", mouseup, true);
})();




























