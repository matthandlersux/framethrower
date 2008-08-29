var rw = transactions.makeSituation();
transactions.modifyContent(rw, 'Real World');

var JB = transactions.makeIndividual(rw);
transactions.modifyContent(JB, 'James Bond');

var OP = transactions.makeIndividual(rw);
transactions.modifyContent(OP, 'Octopussy');

var SleepsWith = transactions.makeRelation(rw);
transactions.modifyContent(SleepsWith, 'Sleeps With');

var JBSleepsWithOP = transactions.makeInfon(rw, SleepsWith, {sleeper:JB, sleepee:OP});
transactions.modifyContent(JBSleepsWithOP, 'JB Sleeps With OP');


/*

var mainAmbient = makeAmbient();

var custComTest = documents.get("testing/xml/visdebugsituation.xml");

var custComTestOut = custComTest({focus: startCaps.unit(rw)});

//make my own box or output pin that takes custComTestOut.output as its input
instProc = function (myOut) {
	return {
		set: function (input) {
			console.log("set input:");
			console.dirxml(input.xml);
		}
	};
};

var mycomp = makeSimpleComponent(interfaces.unit(basic.js), interfaces.unit(basic.js), instProc);
var mycompapply = simpleApply(mycomp, custComTestOut.output);
//need to activate mycompapply...


var bullambient = makeAmbient();
var bullproc = {};

var myendcap = makeSimpleEndCap(bullambient, bullproc, mycompapply);

domEndCap(mainAmbient, custComTestOut.output, document.getElementById("html_mainscreen"), "testing/xml/dummy.file");
*/




//can the xml stuff for now... let's try to make the visdebug ui just with components

//make a 'root' ui situation to hold screen objects
var ui = transactions.makeSituation();
transactions.modifyContent(ui, 'User Interface');


//make boxes and endcaps to add anything under the root situation as a screen object

var bullambient = makeAmbient();
var makeSOproc = {
	add: function (input) {
		console.log("end cap input: ");
		console.log(input);
		//make a screenObject
		var SO = transactions.makeIndividual(ui);
		transactions.modifyContent(SO, 'id:' + input.getId() + ', type:' + input.getType().getName());
	}
};

instProc = function (myOut) {
	return {
		add: function (input) {
			//create applys for each contained object
			if(input.getType().getName() == 'kernel.situation'){
				console.log("situation");
				var subapply = simpleApply(mycomp, input.get.childObjects());
				var subendcap = makeSimpleEndCap(bullambient, makeSOproc, subapply);
			}
			myOut.add(input);
		}
	};
};

var mycomp = makeSimpleComponent(interfaces.set(kernel.ob), interfaces.set(kernel.ob), instProc);
var mycompapply = simpleApply(mycomp, startCaps.set(rw));

//need to activate mycompapply...
var myendcap = makeSimpleEndCap(bullambient, makeSOproc, mycompapply);






//make boxes and endcaps to print screenobjects to screen and layout and such

var toScreenProc = {
	set: function (input) {
		console.log("end cap 2 input: ");
		console.log(input);
	}
};

SOProc = {
	add: function (input) {
		console.log("adding SO end cap input: ");
		console.log(input);
		var subendcap = makeSimpleEndCap(bullambient, toScreenProc, input.get.content());
	}
};

var SOendcap = makeSimpleEndCap(bullambient, SOProc, ui.get.childObjects());