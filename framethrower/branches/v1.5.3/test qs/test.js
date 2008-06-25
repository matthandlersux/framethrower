


var root = makeQStart();


var listenerDeconstructor = {
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


var listener = makeQEnd(listenerDeconstructor, union);*/

/*var composedcom = qCompose(add123com, times24com);

var comp = composedcom.makeApply(root);
var listener = makeQEnd(listenerDeconstructor, comp);*/

function makeQTest(x) {
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

var listener = makeQEnd(listenerDeconstructor, sel);




listener.activate();


/*

var root = {};
var rootQ = makeQ(root);

var qListener = makeComponent(function () {
	var all = makeObjectHash();
	return {
		qAdd: function (o) {
			all.set(o, o);
			console.log("added", o, all.toArray());
		},
		qRemove: function (o) {
			all.remove(o);
			console.log("removed", o, all.toArray());
		}
	};
});


//rootQ.spawn(qListener);



var add123 = rootQ.spawn(qLift(function (x) {
	return [x+1, x+2, x+3];
}));

var times24 = rootQ.spawn(qLift(function (x) {
	return [x*2, x*4];
}));

//add123.spawn(qListener);


var u = {};
var u2 = makeQ(u);

var union = u2.spawn(qUnion);

//u2.spawn(qListener);


u.qAdd(add123);
u.qAdd(times24);


union.spawn(qListener);


*/
