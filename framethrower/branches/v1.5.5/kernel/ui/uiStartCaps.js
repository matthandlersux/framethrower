var uiStartCaps = (function () {
	
	var windowSizeController = {};
	var windowSizeSC = makeStartCap({width: interfaces.unit(basic.number), height: interfaces.unit(basic.number)}, windowSizeController);
	
	function updateWindowSize() {
		windowSizeController.width.set(window.innerWidth);
		windowSizeController.height.set(window.innerHeight);
	}
	window.addEventListener("resize", updateWindowSize, true);
	document.addEventListener("load", updateWindowSize, true);
	
	
	return {
		windowSizeWidth: windowSizeSC.outputPins.width,
		windowSizeHeight: windowSizeSC.outputPins.height
	};
})();