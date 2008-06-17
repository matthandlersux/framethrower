var t = loadXMLNow("testfunc.xml");
console.dirxml(t);
console.dirxml(extractXSLFromCustomXML(t));


var comp = compileCustom(t);

console.dirxml(comp({focusContent:"a string"}));