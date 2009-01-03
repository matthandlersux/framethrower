

var jb = makeObject("K.object", {});
var oddjob = makeObject("K.object", {});
var kills = makeObject("K.object", {});
var jbkills = makeObject("K.cons", {relation:kills, arg:jb});
baseEnv = envAdd(baseEnv, "jbkills", jbkills);
var jbkillsAsObject = evaluate(parseExpr("K.cons.cast.K.object jbkills"));
var jbkillsoddjob = makeObject("K.cons", {relation:jbkillsAsObject, arg:oddjob});
baseEnv = envAdd(baseEnv, "jbkillsoddjob", jbkillsoddjob);
var jbkojAsObject = evaluate(parseExpr("K.cons.cast.K.object jbkillsoddjob"));