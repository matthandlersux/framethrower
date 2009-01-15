// Example Usage of Objects Right Now

var jbInvolves = makeControlledCell("Set Cons");
var ojInvolves = makeControlledCell("Set Cons");
var killsInvolvesLeft = makeControlledCell("Set Cons");
var killsInvolvesRight = makeControlledCell("Set Cons");
var jbkillsInvolvesLeft = makeControlledCell("Set Cons");
var jbkillsInvolvesRight = makeControlledCell("Set Cons");

var jb = objects.make("Object", {involvesLeft:jbInvolves});
var oddjob = objects.make("Object", {involvesLeft:ojInvolves});
var kills = objects.make("Object", {involvesRight:killsInvolvesRight, involvesLeft:killsInvolvesLeft});

var jbkills = objects.make("Cons", {relation:kills, arg:jb, involvesLeft:jbkillsInvolvesLeft,involvesRight:jbkillsInvolvesRight});
jbInvolves.addLine(jbkills);
killsInvolvesRight.addLine(jbkills);

var jbkillsAsObject = classes["Object"].castUp(jbkills);
var jbkillsoddjob = objects.make("Cons", {relation:jbkillsAsObject, arg:oddjob});
ojInvolves.addLine(jbkillsoddjob);
killsInvolvesRight.addLine(jbkillsoddjob);

var jbkojAsObject = classes["Object"].castUp(jbkillsoddjob);
