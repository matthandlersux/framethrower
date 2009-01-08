/*
Here we define our base environment (baseEnv), which is used by expressions.
baseEnv will convert literal strings (Number's, String's, Bool's) to their actual representation
here we also create bindings for our so-called "primitive functions", the server-client shared vocabulary
	these bindings are stored in lookupTable
so in general, baseEnv will take a word and convert it to an Expr
*/

var lookupTable = {};

var baseEnv = function (s) {
	// literals
	if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(s)) {
		// matches a number
		// using http://www.regular-expressions.info/floatingpoint.html
		// might want to find the regular expression that javascript uses...
		return +s;
	} else if (/^".*"$/.test(s)) {
		// matches a string
		return s.substring(1, s.length - 2); // TODO: this needs to strip backslashes
	} else if (s === "true") {
		return true;
	} else if (s === "false") {
		return false;
	} else {
		// lookup
		var lookup = lookupTable[s];
		if (lookup) {
			return lookup;
		} else {
			return emptyEnv(s);
		}
	}
};


// ============================================================================
// Here we define our primitive functions and bind them
// ============================================================================

/*function returnsStartCap(type) {
	// returns true if the type is a function (of n parameters) that returns a StartCap (constructed type)
	if (type.kind === "typeApply") {
		return true;
	} else if (type.kind === "typeLambda") {
		return returnsStartCap(type.right);
	} else {
		return false;
	}
}*/

function addFun(name, typeString, f) {
	/*
	This creates a new Fun object and binds it (by putting it in lookupTable)
	*/
	
	var type = parseType(typeString);
	var fun;
	/*if (returnsStartCap(type)) {
		// save the last parameter as the type of the StartCap to return
		fun = curry(f, f.length - 1);
	} else {
		fun = curry(f);
	}*/
	fun = curry(f);
	
	lookupTable[name] = {
		kind: "fun",
		name: name,
		type: type,
		fun: fun
	};
}


// ============================================================================
// These are like primitive functions in that they're shared between client and server,
// but they are defined using expressions, that is, combinations of primitive functions
// ============================================================================

function addExpr(name, exprString) {
	lookupTable[name] = parseExpr(exprString);
}

addExpr("compose", "f -> g -> x -> f (g x)");
addExpr("const", "x -> y -> x");
addExpr("swap", "f -> x -> y -> f y x");

var exprLib = {

length: "S -> fold(a -> b -> add(b, 1), b -> a -> subtract(b, 1), 0, S)",

mapLength: "compose(length,keys)",

returnSet: "compose(returnUnitSet,returnUnit))",

filter: "S -> pred -> bindSet(compose(returnUnitSet: passThru(pred)): S)",

takeOne: "?",

match: "relation -> arg -> takeOne(filter(relation:involvesR: infon -> equal(infon:arg, arg)))",

// type of reactiveFoldList is something like: (a -> Unit b -> Unit b) -> b -> Map Number a -> Unit b
reactiveFoldList: "?",

//matchList: "relation -> argList -> reactiveFoldList(relSoFar -> arg -> match(relSoFar: arg): relation: argList)",

isInfonTrue: "situatedInfon -> situatedInfon:truth",

getInOntThumbnail: "match(match(in, ont), thumbnail)",


//probably has to be primFunc
firstUnit: "X -> Y -> if X then X else Y",


//returns a list of all the objects that are "sub-objects" of sitObject
//ex: sitObjList(<in, JSIV, <in, T2, <in, Scene1, Term>>>) returns:
//    1: <in, JSIV, <in, T2, <in, Scene1, Term>>>
//    2: <in, T2, <in, Scene1, Term>>
//    3: <in, Scene1, Term>
//    4: Term
sitObjList: "sitObj -> unfoldMap(x -> k.cons:arg(x), sitObj)",

sitObjListRange: "sitObjList -> max -> rangeMapByPos(returnUnit(0), returnUnit(max), sitObjList)",

makeNewSitObj: "sitObjList -> rLeaf -> sortedFoldMap(oldInfon -> arg -> match(k.cons:relation(oldInfon), arg), rLeaf, sitObjList)",

secondBestMatch: "sitObj -> sortedFold(betterAnswer -> num -> firstUnit(betterAnswer, makeNewSitObj(sitObjListRange(sitObjList(sitObj), Length(sitObjList(sitObj))), getKey(Length(sitObjList(sitObj)), sitObjList(sitObj))), nullUnit?, oneTo(Length(sitObjList(sitObj)))))",

findThumbnail: "situatedObj -> firstUnit(match(getInOntThumbnail, situatedObj), secondBestMatch(situatedObj))",




id: "x -> x"
};

/*
forEach(exprLib, function(funcString, name){
	addExpr(name, funcString);
});
*/