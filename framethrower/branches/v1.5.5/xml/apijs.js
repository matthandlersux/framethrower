JSTRANSFUNCS = {};


function test(args) {
	//console.dirxml(args.trace1);
	var comment = document.createElementNS("","comment");

	console.dir(args);
	/*
	// find the lowest situation that contains both a and b
	var aSit = args.trace1;
	var aSitId = aSit.getAttributeNS("", "id");
	var bSit = args.trace2;
	var bSitId = bSit.getAttributeNS("", "id");
	
	
	var aSits = [aSitId];
	var bSits = [bSitId];
	function checkMatch() {
		function check(sit, sits) {
			if (sit) {
				for (var i=0, len = sits.length; i < len; i++) {
					if (sit === sits[i]) {
						sits.splice(i+1, sits.length);
						return true;
					}
				}
			}
		}
		return check(aSitId, bSits) || check(bSitId, aSits);
	}
	var i=0;
	while (!checkMatch()) {
		if (aSit) {
			aSit = aSit.nextSibling;
			aSits.push(aSit.getAttributeNS("", "id"));
		}
		if (bSit) {
			bSit = bSit.nextSibling;
			bSits.push(bSit.getAttributeNS("", "id"));
		}
		if (!aSit && !bSit) {
			throw "Objects not part of the same root situation";
		}
	}
	// okay, now aSits contains a's parent situations up to the lowest common situation, likewise for bSits
	var common = aSits[aSits.length - 1];
	*/
	/*
	// checks if o is in any of sits
	function isIn(o, sits) {
		var sit = o.getParentSituation();
		return any(sits, function (s) {
			return s === sit;
		});
	}
	
	// go up correspond out while staying within sits
	function getHighest(start, sits) {
		var highest = start;
		var next = start.getCorrespondOut();
		while (next && isIn(next, sits)) {
			highest = next;
			next = highest.getCorrespondOut();
		}
		return highest;
	}
	var aHighest = getHighest(a, aSits);
	var bHighest = getHighest(b, bSits);
	
	var aHighestSit = aHighest.getParentSituation();
	var bHighestSit = bHighest.getParentSituation();
	
	// go down corresponds in while staying within sits
	function getLowest(start, sits) {
		function choosePath(choices) {
			var ret = false;
			forEach(choices, function (choice) {
				if (isIn(choice, sits)) {
					ret = choice;
				}
			});
			return ret;
		}
		
		var lowest = start;
		var next = choosePath(start.getCorrespondsIn());
		while (next) {
			lowest = next;
			next = choosePath(next.getCorrespondsIn());
		}
		return lowest;
	}
	
	function makeC(high, low) {
		var p = low.getCorrespondOut();
		if (p) {
			p.removeCorrespondIn(low);
			p.addCorrespondIn(high);
		}
		high.addCorrespondIn(low);
		low.setCorrespondOut(high);
	}
	
	if (aHighestSit === common && bHighestSit === common) {
		// merge aHighest and bHighest
		// TODO
	} else if (aHighestSit === common) {
		var lowest = getLowest(aHighest, bSits);
		makeC(lowest, bHighest);
	} else if (bHighestSit === common) {
		var lowest = getLowest(bHighest, aSits);
		makeC(lowest, aHighest);
	} else {
		// make "ghost" object in common situation
		var ghost = common.makeGhost();
		makeC(ghost, aHighest);
		makeC(ghost, bHighest);
	}
	*/
	
	return comment;
}






JSTRANSFUNCS.test = test;
