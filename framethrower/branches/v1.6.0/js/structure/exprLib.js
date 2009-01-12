var exprLib = {

id: "x -> x",

length: "S -> fold (a -> b -> add b 1) (b -> a -> subtract b 1) 0 S",

maplength: "compose length keys",

invertUnfoldMap: "f -> init -> invert (unfoldMap f init)",

//this might be too inefficient
sortedFoldMap: "f -> init -> m -> sortedFold (k -> accum -> f (getKey k m) accum) init (keys m)",

returnSet: "compose returnUnitSet returnUnit",

filter: "S -> pred -> bindSet (compose returnUnitSet (passThru pred)) S",

staticMatch: "relation -> arg -> takeOne (filter (K.object:upRight relation) (infon -> equal (K.cons:right infon) arg))",

addTest: "a -> b -> returnUnit (add a b)",

bindUnitTwice: "f -> compose (bindUnit id) (bindUnit (compose returnUnit (compose bindUnit f)))",

butTest: "(bindUnitTwice addTest) (returnUnit 1) (returnUnit 2)",

simpleTest: "returnUnit (returnUnit 1)",

match: "bindUnitTwice staticMatch",

// type of reactiveFoldList is something like: (a -> Unit b -> Unit b) -> b -> Map Number a -> Unit b
//reactiveFoldList: "?",

//matchList: "relation -> argList -> reactiveFoldList(relSoFar -> arg -> match(relSoFar: arg): relation: argList)",

isInfonTrue: "situatedInfon -> K.cons:truth situatedInfon",

//getInOntThumbnail: "match (staticMatch shared.in shared.ont) (returnUnit shared.thumbnailthumbnail)",
getInOntThumbnail: "match (returnUnit shared.in) (returnUnit shared.ont)",
//getInOntThumbnail: "bindSet (compose K.object:upRight K.cons~K.object) (returnUnitSet (staticMatch shared.in shared.ont))",

//probably has to be primFunc
firstUnit: "X -> Y -> Y",

//returns a list of all the objects that are "sub-objects" of sitObject
//ex: sitObjList(<in, JSIV, <in, T2, <in, Scene1, Term>>>) returns:
//    1: <in, JSIV, <in, T2, <in, Scene1, Term>>>
//    2: <in, T2, <in, Scene1, Term>>
//    3: <in, Scene1, Term>
//    4: Term
sitObjList: "sitObj -> invertUnfoldMap (x -> K.cons:right x) sitObj",

sitObjListRange: "sitObjList -> max -> rangeMapByPos (returnUnit 0) (returnUnit max) sitObjList",

makeNewSitObj: "sitObjList -> rLeaf -> sortedFoldMap (oldInfon -> arg -> match (K.cons:left oldInfon) arg) rLeaf sitObjList",

nameThisFunc: "sitObj -> betterAnswer -> num -> firstUnit betterAnswer (makeNewSitObj (sitObjListRange (sitObjList sitObj) (length (sitObjList sitObj))) (getKey (length (sitObjList sitObj))))",

secondBestMatch: "betterAnswer -> sitObj -> sortedFold (nameThisFunc sitObj) (sitObjList sitObj) betterAnswer (oneTo (length (sitObjList sitObj)))",

findThumbnail: "situatedObj -> secondBestMatch (match getInOntThumbnail situatedObj) situatedObj"

};


forEach(exprLib, function(funcString, name){
	addExpr(name, funcString);
});
