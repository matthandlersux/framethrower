// Example Usage of Objects Right Now

var jbInvolves = makeControlledCell("Set K.cons");
var ojInvolves = makeControlledCell("Set K.cons");
var killsInvolvesLeft = makeControlledCell("Set K.cons");
var killsInvolvesRight = makeControlledCell("Set K.cons");
var jbkillsInvolvesLeft = makeControlledCell("Set K.cons");
var jbkillsInvolvesRight = makeControlledCell("Set K.cons");

var jb = makeObject("K.object", {involvesLeft:jbInvolves});
var oddjob = makeObject("K.object", {involvesLeft:ojInvolves});
var kills = makeObject("K.object", {involvesRight:killsInvolvesRight, involvesLeft:killsInvolvesLeft});

var jbkills = makeObject("K.cons", {relation:kills, arg:jb, involvesLeft:jbkillsInvolvesLeft,involvesRight:jbkillsInvolvesRight});
jbInvolves.addLine(jbkills);
killsInvolvesRight.addLine(jbkills);

var jbkillsAsObject = classes["K.object"].castUp(jbkills);
var jbkillsoddjob = makeObject("K.cons", {relation:jbkillsAsObject, arg:oddjob});
ojInvolves.addLine(jbkillsoddjob);
killsInvolvesRight.addLine(jbkillsoddjob);

var jbkojAsObject = classes["K.object"].castUp(jbkillsoddjob);
