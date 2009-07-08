var eventExtras = {};
function addEventExtra(name, typeString, f) {
	eventExtras[name] = {type: parseType(typeString), f: f};
}



addEventExtra("event.offsetX", "Number", function (e, target, mouseCurrentPos) {
	return mouseCurrentPos[0] - getPosition(target)[0];
});
addEventExtra("event.offsetY", "Number", function (e, target, mouseCurrentPos) {
	return mouseCurrentPos[1] - getPosition(target)[1];
});
addEventExtra("event.mouseX", "Number", function (e, target, mouseCurrentPos) {
	return mouseCurrentPos[0];
});
addEventExtra("event.mouseY", "Number", function (e, target, mouseCurrentPos) {
	return mouseCurrentPos[1];
});
addEventExtra("event.wheelDelta", "Number", function (e) {
	return e.detail ? e.detail * -1 : e.wheelDelta / 40;
});

addEventExtra("event.wheelDelta", "Number", function (e) {
	return e.detail ? e.detail * -1 : e.wheelDelta / 40;
});

addEventExtra("event.value", "String", function (e) {
	return e.target.value;
});