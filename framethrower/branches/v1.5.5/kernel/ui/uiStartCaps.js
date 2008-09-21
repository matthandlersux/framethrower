var uiStartCaps = (function () {
	
	var windowSizeController = {};
	var windowSizeSC = makeStartCap({width: interfaces.unit(basic.number), height: interfaces.unit(basic.number)}, windowSizeController);
	
	function updateWindowSize() {
		windowSizeController.width.set(window.innerWidth);
		windowSizeController.width.PACKETCLOSE();
		windowSizeController.height.set(window.innerHeight);
		windowSizeController.height.PACKETCLOSE();
	}
	window.addEventListener("resize", updateWindowSize, true);
	document.addEventListener("load", updateWindowSize, true);
	
	
	return {
		windowSizeWidth: windowSizeSC.outputPins.width,
		windowSizeHeight: windowSizeSC.outputPins.height
	};
})();