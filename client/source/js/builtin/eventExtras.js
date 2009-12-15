var eventExtras = {};
function addEventExtra(name, typeString, f) {
	eventExtras[name] = {type: parseType(typeString), f: f};
}


/*
the extra parameter has the following members: {
	e: the event object as given by the DOM
	target: the triggered DOM Node that has the f:on in it
	mouseCurrentPos: [x-coord, y-coord]
}
*/

addEventExtra("event.offsetX", "Number", function (extra) {
	return extra.mouseCurrentPos[0] - getPosition(extra.target)[0];
});
addEventExtra("event.offsetY", "Number", function (extra) {
	return extra.mouseCurrentPos[1] - getPosition(extra.target)[1];
});

addEventExtra("event.posX", "Number", function (extra) {
	return getPosition(extra.target)[0];
});
addEventExtra("event.posY", "Number", function (extra) {
	return getPosition(extra.target)[1];
});
addEventExtra("event.targetWidth", "Number", function (extra) {
	return extra.target.offsetWidth;
});
addEventExtra("event.targetHeight", "Number", function (extra) {
	return extra.target.offsetHeight;
});

addEventExtra("event.targetPosition", "(Bool, Number, Number, Number, Number)", function (extra) {
	return makeTuple(getAllPosition(extra.target));
});


addEventExtra("event.mouseX", "Number", function (extra) {
	return extra.mouseCurrentPos[0];
});
addEventExtra("event.mouseY", "Number", function (extra) {
	return extra.mouseCurrentPos[1];
});
addEventExtra("event.wheelDelta", "Number", function (extra) {
	var e = extra.e;
	return e.detail ? e.detail * -1 : e.wheelDelta / 40;
});

addEventExtra("event.value", "String", function (extra) {
	return extra.target.value;
});

addEventExtra("event.keyCode", "Number", function (extra) {
	var e = extra.e;
	if (e.which !== undefined) {
		return e.which;
	}
	return e.keyCode;
});




// addEventExtra("event.offsetX", "Number", function (e, target, mouseCurrentPos) {
// 	return mouseCurrentPos[0] - getPosition(target)[0];
// });
// addEventExtra("event.offsetY", "Number", function (e, target, mouseCurrentPos) {
// 	return mouseCurrentPos[1] - getPosition(target)[1];
// });
// addEventExtra("event.mouseX", "Number", function (e, target, mouseCurrentPos) {
// 	return mouseCurrentPos[0];
// });
// addEventExtra("event.mouseY", "Number", function (e, target, mouseCurrentPos) {
// 	return mouseCurrentPos[1];
// });
// addEventExtra("event.wheelDelta", "Number", function (e) {
// 	return e.detail ? e.detail * -1 : e.wheelDelta / 40;
// });
// 
// addEventExtra("event.wheelDelta", "Number", function (e) {
// 	return e.detail ? e.detail * -1 : e.wheelDelta / 40;
// });
// 
// addEventExtra("event.value", "String", function (e) {
// 	return e.target.value;
// });
// 
// addEventExtra("event.keyCode", "Number", function (e) {
// 	if (e.which !== undefined) {
// 		return e.which;
// 	}
// 	return e.keyCode;
// });