function loadjscssfile (filename, filetype) {
	if (filetype=="js") { //if filename is a external JavaScript file
		var fileref=document.createElement('script');
		fileref.setAttribute("type","text/javascript");
		fileref.setAttribute("src", filename);
	} else if (filetype=="css") { //if filename is an external CSS file
		var fileref=document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", filename);
	}
	if (typeof fileref!="undefined")
	document.getElementsByTagName("head")[0].appendChild(fileref);
}

//loadjscssfile("../kernel/util/firebugx.js", "js");

loadjscssfile("../kernel/util/json2.js", "js");
loadjscssfile("../kernel/util/util.js", "js");
loadjscssfile("../kernel/util/xml.js", "js");

loadjscssfile("../kernel/hash.js", "js");
loadjscssfile("../kernel/types.js", "js");
loadjscssfile("../kernel/interfaces.js", "js");
loadjscssfile("../kernel/boxes.js", "js");
loadjscssfile("../kernel/scaffold.js", "js");

loadjscssfile("../kernel/guiScaffold.js", "js");

loadjscssfile("../kernel/components.js", "js");


loadjscssfile("../xml/apijs.js", "js");

loadjscssfile("../kernel/customXML/replaceXML.js", "js");
loadjscssfile("../kernel/customXML/parseThunks.js", "js");
loadjscssfile("../kernel/customXML/parsePerforms.js", "js");
loadjscssfile("../kernel/customXML/parseXML.js", "js");
loadjscssfile("../kernel/customXML/pinToXML.js", "js");
loadjscssfile("../kernel/customXML/derive.js", "js");

loadjscssfile("../kernel/customXML/import.js", "js");

loadjscssfile("../kernel/ui/animation.js", "js");
loadjscssfile("../kernel/ui/embed.js", "js");
loadjscssfile("../kernel/ui/events.js", "js");
loadjscssfile("../kernel/ui/uiStartCaps.js", "js");

loadjscssfile("../kernel/actions.js", "js");
