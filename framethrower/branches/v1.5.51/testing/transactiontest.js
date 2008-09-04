var rw = transactions.makeSituation();
transactions.modifyContent(rw, 'Real World');

var GF = transactions.makeSituation(rw);
transactions.modifyContent(GF, 'Gold Finger');

var JB = transactions.makeIndividual(GF);
transactions.modifyContent(JB, 'James Bond');

var OP = transactions.makeIndividual(GF);
transactions.modifyContent(OP, 'Octopussy');

var SleepsWith = transactions.makeRelation(GF);
transactions.modifyContent(SleepsWith, 'Sleeps With');

var JBSleepsWithOP = transactions.makeInfon(GF, SleepsWith, {sleeper:JB, sleepee:OP});
transactions.modifyContent(JBSleepsWithOP, 'JB Sleeps With OP');



var mainAmbient = makeAmbient();

var custComTest = documents.get("testing/xml/printsituation.xml");

var custComTestOut = custComTest({focus: startCaps.unit(rw)});

//make my own box or output pin that takes custComTestOut.output as its input
instProc = function (myOut) {
	return {
		set: function (input) {
//			console.log("set input:");
//			console.dirxml(input.xml);
		}
	};
};

var mycomp = makeSimpleComponent(interfaces.unit(basic.js), interfaces.unit(basic.js), instProc);
var mycompapply = simpleApply(mycomp, custComTestOut.output);
//need to activate mycompapply...


var bullambient = makeAmbient();
var bullproc = {};

var myendcap = makeSimpleEndCap(bullambient, bullproc, mycompapply);


window.addEventListener("load", function(){
	domEndCap(mainAmbient, custComTestOut.output, document.getElementById("html_mainscreen"), "testing/xml/dummy.file");
}, false);
