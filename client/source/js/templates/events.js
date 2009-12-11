var globalEventHandlers = {};


function makeEventExtrasEnv(env, extra) {
	return function (s) {
		if (eventExtras[s]) {
			return eventExtras[s].f(extra);
		} else {
			return env(s);
		}
	};
}


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
		return undefined;
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
	
	function processEvent(eventName, e) {
		
		function trigger(lineAction, actionEnv, extra) {
			var env = makeEventExtrasEnv(actionEnv, extra);
			
			var action = makeClosure(lineAction, env);

			//console.log("about to execute an action!", action);

			executeAction(action, function() {session.flush();});
			
			if (eventName==="mousedown") dont(e); // we're doing a drag-and-drop so prevent text highlighting
		}
		
		
		
		if (globalEventHandlers[eventName]) {
			var did = false;
			forEach(globalEventHandlers[eventName], function (handler) {
				did = true;
				trigger(handler.action, handler.env, {
					e: e,
					mouseCurrentPos: mouseCurrentPos
				});
			});
			if (did) return;
		}
		
		var target = e.target;
		
		if (!target) return;
		
		var xpathExp = "ancestor-or-self::*[f:on/@event='"+eventName+"'][1]";
		
		var fon = xpath(xpathExp, target);
		
		if (fon.length > 0) {
			if (eventName === "mouseout") {
				var rt = e.relatedTarget;
				var commonAncestor = DOMCommonAncestor(target, rt);
				if (!isDOMAncestor(fon[0].parentNode, commonAncestor)) {
					return;
				}
			}
			
			var fonEls = xpath("f:on[@event='" + eventName + "']", fon[0]);
			
			forEach(fonEls, function (fonEl) {
				trigger(fonEl.custom.action, fonEl.custom.env, {
					e: e,
					target: fonEl.parentNode,
					mouseCurrentPos: mouseCurrentPos
				});
			});
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
		processEvent("mousedown", e);
		if (currentFocus && currentFocus.blur && currentFocus !== e.target) {
			var tmp = currentFocus;
			currentFocus=false;
			tmp.blur();
		}
		// if (e.target.localName !== "input" && e.target.localName !== "button" && e.target.localName !== "embed") {
		// 	//document.body.focus();
		// 	dont(e);
		// }
	}
	function mouseup(e) {
		if (mouseIsDragging) {
			processEvent("dragend", e);
		} else {
			processEvent("click", mouseIsDown);
		}
		processEvent("mouseup", e);
		mouseIsDown = false;
		mouseIsDragging = false;
	}
	function dblclick(e) {
		processEvent("dblclick", e); // TODO integrate this better?
	}
	function mousemove(e) {
		mouseCurrentPos[0] = e.clientX;
		mouseCurrentPos[1] = e.clientY;
		processEvent("mousemove", e);
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
			processEvent("mousedrag", e);
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
		processEvent("blur", e);
		if (!currentFocus) processEvent("manualblur", e);
	}	
	function change(e) {
		processEvent("change", e);
	}
	function submit(e) {
		var tmp = currentFocus;
		currentFocus=false;
		tmp.blur();
		dont(e);
	}
	
	function keydown(e) {
		processEvent("keydown", e);
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
	document.addEventListener("keyup", keyup, true);
	document.addEventListener("keypress", keypress, true);
})();



// =========================================================
// Global UI Cells
// =========================================================

var initializeGlobalUICells = function () {
	//var ui = rootObjects["ui.ui"].prop;
	var ui = base.env("ui.ui").prop;
	
	function resizeScreen(e) {
		//console.log("detected screen resize");
		var screenWidth = window.innerWidth;
		var screenHeight = window.innerHeight;
		ui["screenWidth"].control.add(screenWidth);
		ui["screenHeight"].control.add(screenHeight);
		refreshWhenDone();
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
	
	document.addEventListener("mousemove", mousemove, true);
	document.addEventListener("mousedown", mousedown, true);
	document.addEventListener("mouseup", mouseup, true);
	
	resizeScreen();
};




























