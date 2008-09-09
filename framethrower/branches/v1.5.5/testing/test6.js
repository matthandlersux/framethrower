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

var inftest = actions.makeInfon(rw, performs, {performer: sc, performee: jb});

var rose = actions.makeIndividual(tmov);
rose.control.content.set(parseXML("<html:i>Rose</html:i>"));


var zui = layout.zui.make();
zui.control.focus.set(rw);

var zui2 = layout.zui.make();
zui2.control.focus.set(tmov);
zui.control.expandedChildren.add(zui2);


var mainAmbient = makeAmbient();

processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {rw: rw, zui: zui}, "");