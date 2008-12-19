function profileHash(a) {
	var hash = {};
	forEach(a, function (x) {
		hash[x] = true;
	});
}

function profileSortedSet(a) {
	var ss = makeSortedSetNumbers();
	forEach(a, function (x) {
		ss.set(a, true);
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
	
	// console.log("hash", time(function () {
	// 	for (var i = 0; i < 10; i++) {
	// 		profileHash(a);
	// 	}
	// }));
	// 
	// console.log("sortedSet", time(function () {
	// 	for (var i = 0; i < 10; i++) {
	// 		profileSortedSet(a);
	// 	}
	// }));
	
	profileSortedSet(a);
	
}