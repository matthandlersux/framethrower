var transactions = (function() {

	// ============================================================================
	// Basic Actions
	// ============================================================================

	var make = function (type, params, resultName) {
		return {actionType:'make', type:type, params:params, resultName:resultName};
	};

	var intAction = function (subjectprefix, subjectsuffix, action, params) {
		return {actionType:'intAction', subjectprefix:subjectprefix, subjectsuffix:subjectsuffix, action:action, params:params};
	};

	// ============================================================================
	// Transactions
	// ============================================================================

	var makeObjectTransaction = function (type, parentSituation) {
		var t = [];
		t.push(make(type, [{parentSituation:parentSituation}], '$newObject'));
		if(parentSituation){
			t.push(intAction(parentSituation, 'control.childObjects', 'add', ['$newObject']));
		}
		return t;
	};
	
	//TODO: fix pending infon completion in the scaffolding for arc syntax
	var makeInfonTransaction = function (parentSituation, relation, arcs) {
		var t = makeObjectTransaction(kernel.infon, parentSituation);
		t.push(intAction('$newObject', 'control.relation', 'set', [relation]));
		for (key in arcs) {
			if (arcs.hasOwnProperty(key)) {
				t.push(intAction('$newObject', 'control.arcs', 'set', [key, arcs[key]]));
				t.push(intAction(arcs[key], 'control.involves', 'add', ['$newObject']));
			}
		}
		t.push(intAction(relation, 'control.infons', 'add', ['$newObject']));
		return t;
	};
	
	var modifyContentTransaction = function (object, newContent) {
		var t = [];
		t.push(intAction(object, 'control.content', 'set', [newContent]));
		return t;
	};
	

	// ============================================================================
	// Executing Transactions
	// ============================================================================
	
	var executeTransaction = function (transaction) {
		var variables = {};
		forEach(transaction, function(basicAction){
			if (basicAction.actionType == 'make') {
				var result = basicAction.type.make.apply(null, basicAction.params);
				if(basicAction.resultName) {
					variables[basicAction.resultName] = result;
				}
			} else if (basicAction.actionType == 'intAction') {
				var prefix = basicAction.subjectprefix;
				if(typeof(prefix) == 'string'){
					prefix = variables[prefix];
				}
				var suffixArray = basicAction.subjectsuffix.split('.');
				forEach(suffixArray, function(suffixPart){
					prefix = prefix[suffixPart];
				});
				
				for (var i=0; i<basicAction.params.length; i++) {
					var param = basicAction.params[i];
					if(typeof(param) == 'string' && param[0] == '$') {
						basicAction.params[i] = variables[param];
					}
				}
				prefix[basicAction.action].apply(null, basicAction.params);
			}
		});
		return {success:true, variables:variables}; //add more nuanced return values
	};
	
	
	// ============================================================================
	// API Actions (some private, some public)
	// ============================================================================
	
	//private helper functions
	
	var makeObject = function (parentSituation, type) {
		var t = makeObjectTransaction(type, parentSituation);
		var result = executeTransaction(t);
		if(result.success){
			return result.variables['$newObject'];
		} else {
			// show the user an error or something
		}
	};
	
	//public
	return {
		makeSituation: function (parentSituation) {
			return makeObject(parentSituation, kernel.situation);
		},
		makeIndividual: function (parentSituation) {
			return makeObject(parentSituation, kernel.individual);
		},
		makeRelation: function (parentSituation) {
			return makeObject(parentSituation, kernel.relation);
		},
		makeInfon: function (parentSituation, relation, arcs) {
			var t = makeInfonTransaction(parentSituation, relation, arcs);
			executeTransaction(t);
		},
		modifyContent: function (object, newContent) {
			var t = modifyContentTransaction(object, newContent);
			executeTransaction(t);
		}
	};
})();