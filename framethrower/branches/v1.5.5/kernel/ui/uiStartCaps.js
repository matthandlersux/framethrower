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
	
	
	return {
		windowSizeWidth: windowSizeSC.outputPins.width,
		windowSizeHeight: windowSizeSC.outputPins.height
	};
})();