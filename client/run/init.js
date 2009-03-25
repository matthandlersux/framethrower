function initialize() {
	documents.preload("xml/main/main.xml", function () {
		bootstrap(document.body);
	});
}