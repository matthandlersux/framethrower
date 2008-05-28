/**
 * @author boobideedoobop
 */

function makeObject(inType, my){
	var object = {};
	my = my || {};
	my.content = inContent || {};
	my.type = inType || "object";
	
	my.inputOfApps = [];
	my.queryTable = {};
	
	object.getMy = function() {
		return my;
	}
	
	object.getType = function() {
		return my.type;
	};
	
	object.getContent = function() {
		return my.content;
	}
	
	object.update = function(inContent) {
		my.content = inContent;
		forEach(my.inputOfApps, function(app){
			app.computeResult();
		});
	}
	
	object.regInputOfApp = function(app) {
		my.inputOfApps.push(app);
		forEach(my.queryTable, function(entryList){
			forEach(entryList, function(entry){
				var callBack = entry.queryCallBack;
				var tail = entry.tail;
				app.getResult.registerQuery(callBack, tail);
			});
		});
	};
	
	object.registerQuery = function(queryCallBack, objectList){
		my.queryTable[objectList.head].push({
			'queryCallBack': queryCallBack,
			'tail': objectList.tail
		});
		forEach(inputOfApps, function(app){
			app.getResult.registerQuery(queryCallBack, objectList.tail);
		});
	};
	
	return object;
}


function makeFunctionObject(inFunction, my, inObject) {
	//inFunction is a javascript function that takes one input 
	//and returns an object with 2 properties: value and type
	//inObject is optionally an existing object to convert into a function

	if (!inObject) {
		my = my || {};
		inObject = makeObject("function", my);
	}
	else {
		my = inObject.getMy();
		my.type = "function";
	}
	
	my.funcOfApps = my.funcOfApps || [];
	
	inObject.regFuncOfApp = function(app) {
		my.funcOfApps.push(app);

		forEach(my.queryTable[app.getInput()], function(entry){
			var callBack = entry.queryCallBack;
			var tail = entry.tail;
			app.getResult.registerQuery(callBack, tail);
		});

		forEach(my.queryTable[null], function(entry){
			var callBack = entry.queryCallBack;
			var tail = entry.tail;
			app.getResult.registerQuery(callBack, tail);
		});
	};
	
	//override update
	inObject.update = function(inContent){
		my.content = inContent;
		forEach(my.inputOfApps, function(app){
			app.computeResult();
		});		
		forEach(my.funcOfApps, function(app){
			app.computeResult();
		});
	}
	
	inObject.registerQuery = function(queryCallBack, objectList){
		my.queryTable[objectList.head] = {
			'queryCallBack': queryCallBack,
			'tail': objectList.tail
		};
		forEach(inputOfApps, function(app){
			app.getResult.registerQuery(queryCallBack, objectList.tail);
		});
		forEach(funcOfApps, function(app){
			if (head === null || (app.getInput === head)) {
				app.getResult.registerQuery(queryCallBack, objectList.tail);
			}
		});
	};
	
	inObject.update(inFunction);
	
	return inObject;
}

//suchThatFunc is a function that will be run against infons to check if they match the query
//objectList is a structure that can contain objects or null, in the order they are required for the query
//use the makeObjectList function to create the object list
function makeQueryObject(suchThatFunc, objectList, my, inObject) {
	if (!inObject) {
		my = my || {};
		inObject = makeObject("query", my);
	}
	else {
		my = inObject.getMy();
		my.type = "query";
	}

	my.funcOfApps = my.funcOfApps || [];
	
	inObject.regFuncOfApp = function(app) {
		my.funcOfApps.push(app);
	};

	//override update
	inObject.update = function(inContent){
		my.content = inContent;
		forEach(my.inputOfApps, function(app){
			app.computeResult();
		});		
		forEach(my.funcOfApps, function(app){
			app.computeResult();
		});
	}

	inObject.checkNewInfon = function(infon) {
		return suchThatFunc(infon);
	};

	inObject.getObjectList = function() {
		return objectList;
	};
	
	inObject.update(suchThatFunc);
	
	return inObject;
}

//function to create the objectList structure required for makeQueryObject
//objectArray is an array that can contain objects or null, in the order they are required for the query
function makeObjectList(objectArray, index){
	if (index < objectArray.length) {
		var item = {};
		item.head = objectArray[index];
		item.tail = makeObjectList(objectArray, index+1);
		return item;
	}
	return null;
}

function makeInfon(infonContent, my, inObject){
	if (!inObject) {
		my = my || {};
		inObject = makeObject("infon", my);
	}
	else {
		my = inObject.getMy();
		my.type = "infon";
	}
	
	//override update
	inObject.update = function(inContent){
		my.content = inContent;
		forEach(my.inputOfApps, function(app){
			app.computeResult();
		});
		forEach(my.queryTable[null], function(entry){
			entry.queryCallBack(inObject);
		});
	}
	
	inObject.update(infonContent);
	
	return inObject;
}

function makeIndividual(inContent, my, inObject){
	if (!inObject) {
		my = my || {};
		inObject = makeObject("individual", my);
	}
	else {
		my = inObject.getMy();
		my.type = "individual";
	}
	inObject.update(inContent);
	return ind;
}


function makeApp(funcObject, inputObject){
	var app = {};
	
	app.getFunction = function(){
		return funcObject;
	};
	
	app.getInput = function(){
		return inputObject;
	};
	
	//the type of the result depends on the output of the function or query
	var resultObject = makeObject();
	
	app.getResult = function(){
		return result;
	}
	
	app.computeResult = function(){
		//the function in funcObject will update the resultObject content and type
		//this way we keep any links to the resultObject constant
		//maybe will do this through some "mutations" coming out of the function
		if (funcObject.getType == "function") {
			var resultPair = funcObject.getContent()(inputObject);
			result.update(resultPair.type, resultPair.value);
		}
		//we don't want this to do anything if the funcobject is a query
		//this shouldn't happen since we don't register this app as a function
	}
	
	//if the funcObject is a query, register it on the input with a callback function
	if (funcObject.getType == "query") {
		inputObject.registerQuery(function(infon){
			if (query.checkNewInfon(infon)) {
				result.addInfon(infon);
			}
		}, funcObject.getObjectList());
	}
	
	if (funcObject.getType == "function") {
		funcObject.regFuncOfApp(app);
		inputObject.regInputOfApp(app);
	}
	
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
