// create a little test world
var rw = actions.makeSituation();
rw.control.content.set("Real World");


// this is all we need to get started
var mainAmbient = makeAmbient();
processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {rw: rw}, "");

//load a transaction thunk xml
var transPerforms = loadXMLNow(ROOTDIR + 'testing/xml/toplevelperforms.xml');


processAllPerforms(mainAmbient, transPerforms, {rw:rw}, {}, "testing/xml/toplevelperforms.xml");




/*


// add some more stuff to the test world (to test reactivity)

var inftest = actions.makeInfon(rw, performs, {performer: sc, performee: jb});

var rose = actions.makeIndividual(tmov);
rose.control.content.set(parseXML("<html:i>Rose</html:i>"));

*/

// testing svn