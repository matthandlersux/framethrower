function initialize() {
	//console.profile();
	documents.preload("xml/main/main.xml", function () {
		bootstrap(document.body);
	});
}