var rw = transactions.makeSituation();
//transactions.modifyContent(rw, 'Real World');

var JB = transactions.makeIndividual(rw);
//transactions.modifyContent(JB, 'James Bond');

var OP = transactions.makeIndividual(rw);
//transactions.modifyContent(OP, 'Octopussy');

var SleepsWith = transactions.makeRelation(rw);
//transactions.modifyContent(SleepsWith, 'Sleeps With');

var JBSleepsWithOP = transactions.makeInfon(rw, SleepsWith, {sleeper:JB, sleepee:OP});
//transactions.modifyContent(JBSleepsWithOP, 'JB Sleeps With OP');




var mainAmbient = makeAmbient();

var custComTest = documents.get("testing/xml/visdebugsituation.xml");

var custComTestOut = custComTest({focus: startCaps.unit(rw)});

/*
//make my own box or output pin that takes custComTestOut.output as its input
instProc = function (myOut) {
	return {
		add: function (input) {
			console.log("add input" + input);
		},
		remove: function (input) {
			console.log("remove input" + input);
		}
	};
};

var mycomp = makeSimpleComponent('kernel.set', 'kernel.set', instProc);
console.log(mycomp);
//var mycompapply = simpleApply(mycomp, custComTestOut.output);
*/

domEndCap(mainAmbient, custComTestOut.output, document.getElementById("html_mainscreen"), "testing/xml/dummy.file");
