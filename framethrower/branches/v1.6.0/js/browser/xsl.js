
// returns a list of variable names used in some XSL (via <xsl:* select="...$XXX..." /> and <* @*="...{...$XXX...}..." />)
function getVariables(xslNode) {
	var varNames = {};
	function extract(s, node) {
		forEachRegexp(s, /\$[a-zA-Z0-9._-]+/g, function (varName) {
			varName = varName.substr(1);
			// check if varName is defined by a preceding xsl:variable or xsl:param that has that name
			var prec = xpath("../preceding::xsl:*[local-name() = 'variable' or local-name() = 'param'][@name='" + varName + "']", node);
			// if not, add it to the varNames hash
			if (prec.length === 0) {
				varNames[varName] = true;				
			}
		});
	}
	var selectAttributes = xpath(".//xsl:*/@select[contains(., '$')]", xslNode);
	forEach(selectAttributes, function (att) {
		extract(att.nodeValue, att);
	});
	
	var curlyAttributes = xpath(".//*/@*[contains(., '{')]", xslNode);
	forEach(curlyAttributes, function (att) {
		forEachRegexp(att.nodeValue, /{[^}]*}/g, function (s) {
			extract(s, att);
		});
	});
	
	return keys(varNames);
}

// returns a list of template names that are called in some XSL (via <xsl:call-template name="XXX" />)
function getCallTemplates(xslNode) {
	var temps = xpath(".//xsl:call-template/@name", xslNode);
	return map(temps, function (att) {
		return att.nodeValue;
	});
}


function forEachRegexp(s, regexp, f) {
	var result;
	while ((result = regexp.exec(s)) != null) {
		f(result[0]);
	}
}




function makeXSLFromTemplate(templateNode) {
	var baseNode = xpath("*[not(self::f:param | self::f:derive | self::f:template | self::f:action | self::xsl:template)]", templateNode);
	
	console.log(baseNode);
	
	baseNode = cloneNode(baseNode[0]); // TODO: if baseNode has more than one element, put them all in a f:result or something
	
	console.log("got here", templateNode, baseNode);
	
	var calledTemplates = getCallTemplates(baseNode);
	calledTemplates = map(calledTemplates, function (name) {
		var xslTemplate = xpath("ancestor-or-self::*/xsl:template[@name='" + name + "'][1]", templateNode);
		// TODO: throw error if doesn't exist
		return cloneNode(xslTemplate[0]);
	});
	
	var varNames = getVariables(baseNode);
	
	var ss = createEl("xsl:stylesheet");
	setAttr(ss, "version", "1.0");
	
	forEach(varNames, function (varName) {
		var v = createEl("xsl:variable");
		setAttr(v, "name", varName);
		setAttr(v, "select", "(f:pass|*/f:pass)[@name='" + varName + "']/node()");
		
		appendChild(ss, v);		
	});
	
	var baseTemplate = createEl("xsl:template");
	setAttr(baseTemplate, "match", "/");
	appendChild(baseTemplate, baseNode);
	appendChild(ss, baseTemplate);
	
	forEach(calledTemplates, function (xslTemplate) {
		appendChild(ss, xslTemplate);
	});
	
	return ss;
}

function cloneNode(node) {
	var clone = node.cloneNode(true);
	document.adoptNode(clone);
	return clone;
}