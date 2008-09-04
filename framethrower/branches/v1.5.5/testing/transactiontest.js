// create a little test world

var rw = actions.makeSituation();
rw.control.content.set("Real World");

var sc = actions.makeIndividual(rw);
sc.control.content.set("Sean Connery");

var gfmov = actions.makeSituation(rw);
gfmov.control.content.set("Goldfinger");

var jb = actions.makeIndividual(gfmov);
jb.control.content.set("James Bond");

var performs = actions.makeRelation(rw);
performs.control.content.set(parseXML('<pseudo><role role="performer" /> performs <role role="performee" /></pseudo>'));

var tmov = actions.makeSituation(rw);
tmov.control.content.set("Titanic");



// this is all we need to get started
var mainAmbient = makeAmbient();
processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {rw: rw}, "");

//load a transaction thunk xml
var transPerforms = loadXMLNow(ROOTDIR + 'testing/xml/toplevelperforms.xml');

console.dirxml(transPerforms);

processAllPerforms(mainAmbient, transPerforms, {rw:rw}, {}, "");




/*


// add some more stuff to the test world (to test reactivity)

var inftest = actions.makeInfon(rw, performs, {performer: sc, performee: jb});

var rose = actions.makeIndividual(tmov);
rose.control.content.set(parseXML("<html:i>Rose</html:i>"));

*/

// testing svn