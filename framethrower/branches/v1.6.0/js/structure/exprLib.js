/*
TODO:
gate/passthru
put Futures where they're supposed to be
make a Null type for Unit Null instead of Unit Bool?
make an Ord type for generic ordering
*/



var exprLib = {
	identity: {
		type: "a -> a",
		expr: "x -> x"
	},
	returnSet: {
		type: "a -> Set a",
		expr: "x -> returnUnitSet (returnUnit x)"
	},
	mapUnit: {
		type: "(a -> b) -> Unit a -> Unit b",
		expr: "f -> bindUnit (compose returnUnit f)"
	},
	mapSet: {
		type: "(a -> b) -> Set a -> Set b",
		expr: "f -> bindSet (compose returnSet f)"
	},
	flattenUnit: {
		type: "Unit (Unit a) -> Unit a",
		expr: "bindUnit identity"
	},
	flattenSet: {
		type: "Set (Set a) -> Set a",
		expr: "bindSet identity"
	}
};


forEach(exprLib, function(o, name){
	addExpr(name, o.expr, o.type);
});

// <<<<<<< .mine
// 
// =======
// >>>>>>> .r555
// 
// <<<<<<< .mine
// var exprLib = {
// 
// 
// 
// identity: "x -> x",
// 
// returnSet: "x -> returnUnitSet (returnUnit x)",
// 
// mapUnit: "f -> bindUnit (compose returnUnit f)",
// mapSet: "f -> bindSet (compose returnSet f)",
// flattenUnit: "bindUnit identity",
// flattenSet: "bindSet identity",
// 
// 
// 
// 
// 
// //match: "rel -> arg -> union ((bindSet Object:upRight) rel) ((bindSet Object:upLeft) arg)",
// 
// 
// // TODO: this can be replaced by whatever we use to memoize Cons creation
// //matchStatic: "rel -> arg -> takeOne (match (returnSet rel) (returnSet arg))",
// 
// 
// 
// /*
// needed for UI:
// 
// versions :: Object -> Set Object
// given object o, this (recursively) returns o and all infons looking like (in * o)
// 
// about :: Object -> Set Cons
// given object o, this returns all Cons's "above" o
// 
// 
// 
// */
// 
// 
// //about: "obj -> (Object:upLeft obj)",
// 
// // takeLastMap :: Map a b -> Set b
// 
// // unfoldToEnd :: (a -> Set a) -> a -> Set a
// //unfoldToEnd: "unfolder -> set -> takeLastMap (invert (unfoldMap unfolder set))",
// 
// 
// // getInfonsUsingRelation :: Object -> Set Object
// //getInfonsUsingRelation: "rel -> unfoldToEnd (compose (mapSet Cons~Object) Object:upRight) rel",
// 
// 
// 
// 
// id: "x -> x"
// 
// 
// 
// /*
// 
// 
// 
// id: "x -> x",
// 
// length: "S -> fold (a -> b -> add b 1) (b -> a -> subtract b 1) 0 S",
// 
// maplength: "compose length keys",
// 
// invertUnfoldMap: "f -> init -> invert (unfoldMap f init)",
// 
// //this might be too inefficient
// sortedFoldMap: "f -> init -> m -> sortedFold (k -> accum -> f (getKey k m) accum) init (keys m)",
// 
// returnSet: "compose returnUnitSet returnUnit",
// 
// filter: "S -> pred -> bindSet (compose returnUnitSet (passThru pred)) S",
// 
// staticMatch: "relation -> arg -> takeOne (filter (Object:upRight relation) (infon -> equal (Cons:right infon) arg))",
// 
// addTest: "a -> b -> returnUnit (add a b)",
// 
// bindUnitTwice: "f -> compose (bindUnit id) (bindUnit (compose returnUnit (compose bindUnit f)))",
// 
// butTest: "(bindUnitTwice addTest) (returnUnit 1) (returnUnit 2)",
// 
// simpleTest: "returnUnit (returnUnit 1)",
// 
// match: "bindUnitTwice staticMatch",
// 
// // type of reactiveFoldList is something like: (a -> Unit b -> Unit b) -> b -> Map Number a -> Unit b
// //reactiveFoldList: "?",
// 
// //matchList: "relation -> argList -> reactiveFoldList(relSoFar -> arg -> match(relSoFar: arg): relation: argList)",
// 
// isInfonTrue: "situatedInfon -> Cons:truth situatedInfon",
// 
// //getInOntThumbnail: "match (staticMatch shared.in shared.ont) (returnUnit shared.thumbnailthumbnail)",
// getInOntThumbnail: "match (returnUnit shared.in) (returnUnit shared.ont)",
// //getInOntThumbnail: "bindSet (compose Object:upRight Cons~Object) (returnUnitSet (staticMatch shared.in shared.ont))",
// 
// //probably has to be primFunc
// firstUnit: "X -> Y -> Y",
// 
// //returns a list of all the objects that are "sub-objects" of sitObject
// //ex: sitObjList(<in, JSIV, <in, T2, <in, Scene1, Term>>>) returns:
// //    1: <in, JSIV, <in, T2, <in, Scene1, Term>>>
// //    2: <in, T2, <in, Scene1, Term>>
// //    3: <in, Scene1, Term>
// //    4: Term
// sitObjList: "sitObj -> invertUnfoldMap (x -> Cons:right x) sitObj",
// 
// sitObjListRange: "sitObjList -> max -> rangeMapByPos (returnUnit 0) (returnUnit max) sitObjList",
// 
// makeNewSitObj: "sitObjList -> rLeaf -> sortedFoldMap (oldInfon -> arg -> match (Cons:left oldInfon) arg) rLeaf sitObjList",
// 
// nameThisFunc: "sitObj -> betterAnswer -> num -> firstUnit betterAnswer (makeNewSitObj (sitObjListRange (sitObjList sitObj) (length (sitObjList sitObj))) (getKey (length (sitObjList sitObj))))",
// 
// secondBestMatch: "betterAnswer -> sitObj -> sortedFold (nameThisFunc sitObj) (sitObjList sitObj) betterAnswer (oneTo (length (sitObjList sitObj)))",
// 
// findThumbnail: "situatedObj -> secondBestMatch (match getInOntThumbnail situatedObj) situatedObj"
// 
// 
// */
// 
// 
// };
// 
// 
// forEach(exprLib, function(funcString, name){
// 	addExpr(name, funcString);
// });// 
// =======
// 
// 
// bindUnitTwice: "func -> arg1 -> arg2 -> bindUnit id (reactiveApply (((compose bindUnit (f -> compose returnUnit (compose bindUnit f))) func) arg1) arg2)",
// 
// 
// 
// 
// //matching
// staticMatch: "relation -> arg -> takeOne (filter (K.object:upRight relation) (infon -> equal (K.cons:right infon) arg))",
// 
// 
// match: "bindUnitTwice staticMatch",
// 
// 
// //matches that return a set
// 
// matchLeft: "relation -> K.object:upRight relation",
// 
// matchRight: "arg -> K.object:upLeft arg",
// 
// staticMatchSet: "relation -> arg -> filter (K.object:upRight relation) (infon -> equal (K.cons:right infon) arg)",
// 
// matchSet: "bindUnitTwice staticMatchSet", 
// 
// matchRightSet: "left -> rightSet -> bindSet (setItem -> matchSet left setItem) rightSet",
// 
// 
// //infon functions
// 
// isInfonTrue: "situatedInfon -> K.cons:truth situatedInfon",
// 
// 'UnitK.cons~K.object': "argUnit -> bindUnit (compose returnUnit K.cons~K.object) argUnit",
// 
// 'UnitK.cons:right': "argUnit -> bindUnit K.cons:right argUnit",
// 
// 
// 
// getInOntThumbnail: "match (UnitK.cons~K.object (staticMatch shared.in shared.ont)) (returnUnit shared.thumbnail)",
// //getInOntThumbnail: "staticMatch shared.in shared.ont",
// //getInOntThumbnail: "bindSet (compose K.object:upRight K.cons~K.object) (returnUnitSet (staticMatch shared.in shared.ont))",
// 
// getInOntName: "match (UnitK.cons~K.object (staticMatch shared.in shared.ont)) (returnUnit shared.name)",
// 
// //probably has to be primFunc
// firstUnit: "X -> Y -> Y",
// 
// //returns a list of all the objects that are "sub-objects" of sitObject
// //ex: sitObjList(<in, JSIV, <in, T2, <in, Scene1, Term>>>) returns:
// //    1: <in, JSIV, <in, T2, <in, Scene1, Term>>>
// //    2: <in, T2, <in, Scene1, Term>>
// //    3: <in, Scene1, Term>
// //    4: Term
// sitObjList: "sitObj -> invertUnfoldMap (x -> K.cons:right x) sitObj",
// 
// sitObjListRange: "sitObjList -> max -> rangeMapByPos (returnUnit 0) (returnUnit max) sitObjList",
// 
// makeNewSitObj: "sitObjList -> rLeaf -> sortedFoldMap (oldInfon -> arg -> match (K.cons:left oldInfon) arg) rLeaf sitObjList",
// 
// nameThisFunc: "sitObj -> betterAnswer -> num -> firstUnit betterAnswer (makeNewSitObj (sitObjListRange (sitObjList sitObj) (length (sitObjList sitObj))) (getKey (length (sitObjList sitObj))))",
// 
// secondBestMatch: "betterAnswer -> sitObj -> sortedFold (nameThisFunc sitObj) (sitObjList sitObj) betterAnswer (oneTo (length (sitObjList sitObj)))",
// 
// matchStaticUnit: "arg1 -> arg2Unit -> bindUnit (staticMatch arg1) arg2Unit",
// 
// findThumbnail: "situatedObj -> secondBestMatch (match getInOntThumbnail situatedObj) situatedObj",
// 
// getName: "namedObjUnit -> UnitK.cons:right (match (UnitK.cons~K.object getInOntName) namedObjUnit)",
// 
// 
// //tests
// 
// addTest: "a -> b -> returnUnit (add a b)",
// 
// butTest: "(bindUnitTwice addTest) (returnUnit 1) (returnUnit 5)",
// 
// simpleTest: "returnUnit (returnUnit 1)",
// 
// 
// matchTest: "sitObj -> match (UnitK.cons~K.object getInOntThumbnail) sitObj",
// 
// unitTest: "getInOntName"
// 
// //unitTest: "staticMatch shared.in shared.ont"
// 
// };
// 
// 
// forEach(exprLib, function(funcString, name){
// 	addExpr(name, funcString);
// });
// >>>>>>> .r555
