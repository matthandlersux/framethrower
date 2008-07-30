
var root = {};
var sc = makeStartCap({a: interfaces.set, b: interfaces.unit}, root);


var add123com = liftSet(function (x) {return [x+1, x+2, x+3];});
var add123 = add123com.makeApply({input: sc.outputPins.a});




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

var ec = mainAmbient.makeEndCap(setLogger, {input: add123.outputPins.output});

ec.activate();


var visqtest = function(){
	return globalQArray;
};


// then call
// root.a.add(3);
// etc