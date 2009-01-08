function profileHash(a) {
	var hash = {};
	forEach(a, function (x) {
		hash[x] = true;
	});
}

function profileSet(a, ss) {
	forEach(a, function (x) {
		ss.set(x, true);
	});
}

function profileGet(a, ss) {
	forEach(a, function (x) {
		ss.get(x);
	});
}

function profileRemove(a, ss) {
	forEach(a, function (x) {
		ss.remove(x);
	});
}

function getTime() {
	return (new Date()).getTime();
}

function time(f) {
	var t = getTime();
	f();
	return getTime() - t;
}


function runTests() {
	var a = [];
	for (var i = 0; i < 500; i++) {
		a.push(Math.random());
	}
	
	var ss = makeSortedSetNumbers();
	
	console.log("hash", time(function () {
		profileHash(a);
	}));
	
	console.log("sortedSet Set", time(function () {
		profileSet(a, ss);
	}));
	
	console.log("sortedSet Get", time(function () {
		profileGet(a, ss);
	}));

	console.log("sortedSet Remove", time(function () {
		profileRemove(a, ss);
	}));

	var ss2 = makeAltSortedSetNumbers();
	
	console.log("\naltSortedSet Set", time(function () {
		profileSet(a, ss2);
	}));
	
	console.log("altSortedSet Get", time(function () {
		profileGet(a, ss2);
	}));

	console.log("altSortedSet Remove", time(function () {
		profileRemove(a, ss2);
	}));
	
	var ss3 = makeConSortedSetNumbers();
	
	console.log("\nconSortedSet1 Set", time(function () {
		profileSet(a, ss3);
	}));
	
	console.log("conSortedSet1 Get", time(function () {
		profileGet(a, ss3);
	}));
	
	console.log("conSortedSet1 Remove", time(function () {
		profileRemove(a, ss3);
	}));

	var ss4 = makeConSortedSetNumbers();
	
	console.log("\nconSortedSet2 MakeSorted", time(function () {
		ss4.makeSorted();
	}));
	
	console.log("conSortedSet2 Set", time(function () {
		profileSet(a, ss4);
	}));
	
	console.log("conSortedSet2 Get", time(function () {
		profileGet(a, ss4);
	}));
	
	console.log("conSortedSet2 Remove", time(function () {
		profileRemove(a, ss4);
	}));
	
	var ss5 = makeConSortedSetNumbers();
	console.log("\nconSortedSet3 Set", time(function () {
		profileSet(a, ss5);
	}));
	
	console.log("conSortedSet3 MakeSorted", time(function () {
		ss5.makeSorted();
	}));
	
	console.log("conSortedSet3 Get", time(function () {
		profileGet(a, ss5);
	}));
	
	console.log("conSortedSet3 Remove", time(function () {
		profileRemove(a, ss5);
	}));
}