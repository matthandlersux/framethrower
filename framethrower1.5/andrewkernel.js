/**
 * @author boobideedoobop
 */

function makeObject(inType, inContent){
	var object = {};
	var content = inContent;
	var type = inType;
	
	var funcOfApps = [];
	var inputOfApps = [];
	
	var queryTable = {};
	
	
	object.getType = function() {
		return type;
	};
	
	object.getContent = function() {
		return content;
	}
	
	object.update = function(inType, inContent) {
		type = inType;
		content = inContent;
		forEach(inputOfApps, function(app){
			app.computeResult();
		});
		forEach(funcOfApps, function(app){
			app.computeResult();
		});
		if (type == "infon") {
			forEach(queryTable, function(head, value) {
				forEach(value.queryCallBack, function(callBack){
					callBack(object);
				});
			});
		}
	}
	
	object.regFuncOfApp = function(app) {
		funcOfApps.push(app);
	};
	
	object.regInputOfApp = function(app) {		
		inputOfApps.push(app);
	};
	
	object.registerQuery = function(queryCallBack, objectList) {
		queryTable[objectList.head] = {'queryCallBack':queryCallBack, 'tail':objectList.tail};
		forEach(inputOfApps, function(app){
			app.getResult.registerQuery(queryCallBack, objectList.tail);
		});
		forEach(funcOfApps, function(app){
			if (head == null || (app.getInput == head)) {
				app.getResult.registerQuery(queryCallBack, objectList.tail);
			}
		});
	};
	
	return object;
}


function makeFunctionObject(inFunction) {
	//inFunction is a javascript function that takes one input 
	//and returns an object with 2 properties: value and type
	var funcObject = makeObject("function", inFunction);
	return funcObject;
}

//suchThatFunc is a function that will be run against infons to check if they match the query
//objectList is an array that can contain objects or null, in the order they are required for the query
function makeQueryObject(suchThatFunc, objectList) {
	var query = makeObject("query", suchThatFunc);
	var funcOfApps = [];
	
	
	//override regFuncOfApp from object. Not sure if this is necessary?
	//we need access to funcOfApps
	query.regFuncOfApp = function(app) {
		funcOfApps.push(app);
		
	};

	query.checkNewInfon = function(infon) {
		
	}

	query.getObjectList = function() {
		return objectList;
	}
	
	return query;
}

function makeInfon(){
	var infon = makeObject("infon");
	return infon;
}

function makeIndividual(){
	var ind = makeObject("individual");
	return ind;
}


function makeApp(funcObject, inputObject) {
	var app = {};
	
	app.getFunction = function() {
		return funcObject;
	};
	
	app.getInput = function() {
		return inputObject;
	};
	
	//the type of the result depends on the output of the function or query
	var resultObject = makeObject();
	
	app.getResult = function() {
		return result;
	}

	if (funcObject.getType == "function") {
		app.computeResult = function(){
			//the function in funcObject will update the resultObject content and type
			//this way we keep any links to the resultObject constant
			var resultPair = funcObject.getContent()(inputObject);
			result.update(resultPair.type, resultPair.value);
		}
	}
	
	//if the funcObject is a query, register it on the input with a callback function
	if (funcObject.getType == "query") {
		inputObject.registerQuery(function(infon) {
			if(query.checkNewInfon(infon)){
				result.addInfon(infon);
			}
		});
	}
	
	
	funcObject.regFuncOfApp(app);
	inputObject.regInputOfApp(app);
	
	return app;
}

function makeApp(funcObject, inputList) {
	var lastFunc = funcObject;
	var app;
	forEach(inputList, function (input) {
		//maybe do some type checking to make sure lastFunc is a function
		app = makeApp(lastFunc, input);
		lastFunc = app.getResult();
	});
}
