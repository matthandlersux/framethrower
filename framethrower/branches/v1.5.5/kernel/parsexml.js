


function applyGet(input, what) {
	var t = input.getOutputInterface();
	
	function getf(x) {
		if (x && x.get[what]) {
			return x.get[what].apply(null, []);
		}
	}
	
	var intf = t.getConstructor();
	var intfargs = t.getArguments();
	
	var intermediate;
	if (intf === interfaces.unit) {
		
	} else if (intf === interfaces.set) {
		
	}
}