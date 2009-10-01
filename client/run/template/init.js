// preparse(mainTemplate);

// desugarFetch(mainTemplate);


//var compiledTemplate = makeClosure(mainTemplate, base.env);
var compiledTemplate = evaluate(makeClosure(mainTemplate, base.env));


function initialize() {
	var node = xmlToDOM(compiledTemplate.xml, compiledTemplate.env);
	
	document.body.appendChild(node.node);

	document.body.focus();
}