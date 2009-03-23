


var root = makeQStart();


var listenerEndcap = {
	add: function (o) {
		console.log("added", o);
	},
	remove: function (o) {
		console.log("removed", o);
	}
};


var add123com = qLift(function (x) {
	return [x+1, x+2, x+3];
});

var add123 = add123com.makeApply(root);

var times24com = qLift(function (x) {
	return [x*2, x*4];
});

var times24 = times24com.makeApply(root);


/*var unionStart = makeQStart();
unionStart.input.add(add123);
unionStart.input.add(times24);

var union = qUnion.makeApply(unionStart);


var listener = makeQEnd(listenerEndcap, union);*/

var composedcom = qCompose(add123com, times24com);

var comp = composedcom.makeApply(root);
var listener = makeQEnd(listenerEndcap, comp);

/*function makeQTest(x) {
	var q = makeQStart();
	q.input.add(x+1);
	q.input.add(x+2);
	q.input.add(x+3);
	setInterval(function () {
		q.input.add(x+Math.random());
	}, 3000);
	return q;
}

var selcom = qSelect(makeQTest);

var sel = selcom.makeApply(root);

var listener = makeQEnd(listenerEndcap, sel);*/




listener.activate();

