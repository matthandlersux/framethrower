// Example Usage of Objects Right Now

var jb = makeObject("K.object", {});
var oddjob = makeObject("K.object", {});
var kills = makeObject("K.object", {});
var jbkills = makeObject("K.cons", {relation:kills, arg:jb});
var jbkillsAsObject = classes["K.object"].castUp(jbkills);
var jbkillsoddjob = makeObject("K.cons", {relation:jbkillsAsObject, arg:oddjob});
var jbkojAsObject = classes["K.object"].castUp(jbkillsoddjob);
