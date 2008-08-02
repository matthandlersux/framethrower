


var root = {};
var sc = makeStartCap({a: interfaces.set, b: interfaces.unit}, root);


var com = {
	add123: components.set.liftG(function (x) {return [x+1, x+2, x+3];}),
	times24: components.set.liftG(function (x) {return [x*2, x*4];})
};

com.composeTest = simpleCompose(com.add123, com.times24);


var add123 = simpleApply(com.add123, sc.outputPins.a);
var times24 = simpleApply(com.times24, sc.outputPins.a);

var c = simpleApply(com.composeTest, sc.outputPins.a);


var unionTest = {};
var unionTestSc = makeStartCap({output: interfaces.set}, unionTest);

unionTest.output.add(add123);
unionTest.output.add(times24);

var u = simpleApply(components.set.union, unionTestSc.outputPins.output);


function setLogger () {
	return {
		input: {
			add: function (o) {
				console.log("adding", o);
			},
			remove: function (o) {
				console.log("removing", o);
			}
		}
	};
}

var mainAmbient = makeAmbient();

//var ec = mainAmbient.makeEndCap(setLogger, {input: c});

var ec = makeSimpleEndCap(mainAmbient, {
	add: function (o) {
		console.log("adding", o);
	},
	remove: function (o) {
		console.log("removing", o);
	}
}, u);

ec.activate();


// then call
// root.a.add(3);
// etc