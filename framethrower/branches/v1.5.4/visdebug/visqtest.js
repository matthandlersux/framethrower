
var sc2controller = {};
var sc2 = makeSimpleStartCap(interfaces.set, sc2controller);

var com = {
	add123: components.set.liftG(function (x) {return [x+1, x+2, x+3];}),
	times24: components.set.liftG(function (x) {return [x*2, x*4];})
};

com.composeTest = simpleCompose(com.add123, com.times24);


//var add123 = simpleApply(com.add123, sc.outputPins.a);
//var times24 = simpleApply(com.times24, sc.outputPins.a);

//var c = simpleApply(com.composeTest, sc.outputPins.a);

var add123 = simpleApply(com.add123, sc2);
var times24 = simpleApply(com.times24, sc2);

var c = simpleApply(com.composeTest, sc2);



var unionTest = {};
var unionTestSc = makeStartCap({output: interfaces.set}, unionTest);

unionTest.output.add(add123);
unionTest.output.add(times24);

var u = simpleApply(components.set.union, unionTestSc.outputPins.output);

var mainAmbient = makeAmbient();

//var ec = mainAmbient.makeEndCap(setLogger, {input: c});

var setLogger = {
	add: function (o) {
		console.log("adding", o);
	},
	remove: function (o) {
		console.log("removing", o);
	}
};
var unitLogger = {
	set: function (o) {
		console.log("set as", o);
	}
};

var ec = makeSimpleEndCap(mainAmbient, setLogger, u);

ec.activate();


var convert = simpleApply(components.convert.setToUnit, u);
var unitec2 = makeSimpleEndCap(mainAmbient, unitLogger, convert);
unitec2.activate();


var unit1controller = {};
var unit2controller = {};
var unitsc1 = makeSimpleStartCap(interfaces.unit, unit1controller);
var unitsc2 = makeSimpleStartCap(interfaces.unit, unit2controller);


com.tensor = components.unit.tensor("first", "second");

var t = com.tensor.makeApply({first: unitsc1, second: unitsc2});

var unitec = makeSimpleEndCap(mainAmbient, unitLogger, t.output);

unitec.activate();

var visqtest = function(){
	return globalQArray;
};


// then call
// root.a.add(3);
// etc