var uiStartCaps = (function () {
	
	var windowSizeController = {};
	var windowSizeSC = makeStartCap({width: interfaces.unit(basic.number), height: interfaces.unit(basic.number)}, windowSizeController);
	
	var wsWidth, wsHeight;
	function updateWindowSize() {
		console.log("updating window size");
		if (window.innerWidth !== wsWidth) {
			windowSizeController.width.set(window.innerWidth);
			windowSizeController.width.PACKETCLOSE();
			wsWidth = window.innerWidth;
		}
		if (window.innerHeight !== wsHeight) {
			windowSizeController.height.set(window.innerHeight);
			windowSizeController.height.PACKETCLOSE();
			wsHeight = window.innerHeight;
		}
	}
	window.addEventListener("resize", updateWindowSize, true);
	document.addEventListener("load", updateWindowSize, true);
	
	
	var mousePositionController = {};
	var mousePositionSC = makeStartCap({x: interfaces.unit(basic.number), y: interfaces.unit(basic.number)}, mousePositionController);
	
	var mpx, mpy;
	function updateMousePosition(e) {
		var x = e.clientX;
		var y = e.clientY;
		if (x !== mpx) {
			mousePositionController.x.set(x);
			mousePositionController.x.PACKETCLOSE();
			mpx = x;
		}
		if (y !== mpy) {
			mousePositionController.y.set(y);
			mousePositionController.y.PACKETCLOSE();
			mpy = y;
		}
	}
	document.addEventListener("mousemove", updateMousePosition, true);
	
	
	return {
		windowSizeWidth: windowSizeSC.outputPins.width,
		windowSizeHeight: windowSizeSC.outputPins.height,
		mousePositionX: mousePositionSC.outputPins.x,
		mousePositionY: mousePositionSC.outputPins.y
	};
})();