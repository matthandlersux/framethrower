var importWorld = (function () {
	var importer1, importer2;

	
	return {
		importWorld: function (xml) {
			importer1 = compileXSL(loadXMLNow(ROOTDIR + "xml/import/import.xsl"));

			importer2 = compileXSL(loadXMLNow(ROOTDIR + "xml/import/importType.xsl"));
			
			var transXML = importer1(importer2(xml, {}), {});
			
			//console.dirxml(transXML);
			
			var transaction = {xml: transXML, ids: {}};
			
			var res = executeTransaction(transaction, "xml/api/").returnVars;
			
			//console.dir(res);
			
			return res;
		}
	};
})();