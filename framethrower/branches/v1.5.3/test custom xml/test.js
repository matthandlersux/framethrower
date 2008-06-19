var t = loadXMLNow("testfunc.xml");
//console.dirxml(t);
//console.dirxml(extractXSLFromCustomXML(t));


//var comp = compileCustom(t);

//console.dirxml(comp({focusContent:"a string"}));


var s = makeSituation();
var jb = s.makeIndividual();
jb.setContent("James Bond");


//getDerivements(t, {focus: jb}, "someid", function () {});

var f = s.makeFunction(null, t);

var a = f.makeApply(null, {focus: jb});

var relation = s.makeRelation();
var role = s.makeRole();

var individual = s.makeIndividual();

var arc = {arg:individual,role:role};
var arcs = [arc];

var infon = relation.makeInfon(undefined,arcs);



var serialized = serializeObject(s);

importAs("copy.", serialized, s);

console.dirxml(serializeObject(s));