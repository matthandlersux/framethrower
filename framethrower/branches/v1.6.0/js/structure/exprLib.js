var exprLib = {

id: "x -> x",

length: "S -> fold (a -> b -> add b 1) (b -> a -> subtract b 1) 0 S",

maplength: "compose length keys",

invertUnfoldMap: "f -> init -> invert (unfoldMap f init)",

//this might be too inefficient
sortedFoldMap: "f -> init -> m -> sortedFold (k -> accum -> f (getKey k m) accum) init (keys m)",

filter: "S -> pred -> bindSet (compose returnUnitSet (passThru pred)) S",



bindUnitTwice: "func -> arg1 -> arg2 -> bindUnit id (reactiveApply (((compose bindUnit (f -> compose returnUnit (compose bindUnit f))) func) arg1) arg2)",




//matching
staticMatch: "relation -> arg -> takeOne (filter (K.object:upRight relation) (infon -> equal (K.cons:right infon) arg))",


match: "bindUnitTwice staticMatch",


//matches that return a set

matchLeft: "relation -> K.object:upRight relation",

matchRight: "arg -> K.object:upLeft arg",

staticMatchSet: "relation -> arg -> filter (K.object:upRight relation) (infon -> equal (K.cons:right infon) arg)",

matchSet: "bindUnitTwice staticMatchSet", 

matchRightSet: "left -> rightSet -> bindSet (setItem -> matchSet left setItem) rightSet",


//infon functions

isInfonTrue: "situatedInfon -> K.cons:truth situatedInfon",

'UnitK.cons~K.object': "argUnit -> bindUnit (compose returnUnit K.cons~K.object) argUnit",

'UnitK.cons:right': "argUnit -> bindUnit K.cons:right argUnit",



getInOntThumbnail: "match (UnitK.cons~K.object (staticMatch shared.in shared.ont)) (returnUnit shared.thumbnail)",
//getInOntThumbnail: "staticMatch shared.in shared.ont",
//getInOntThumbnail: "bindSet (compose K.object:upRight K.cons~K.object) (returnUnitSet (staticMatch shared.in shared.ont))",

getInOntName: "match (UnitK.cons~K.object (staticMatch shared.in shared.ont)) (returnUnit shared.name)",

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

matchStaticUnit: "arg1 -> arg2Unit -> bindUnit (staticMatch arg1) arg2Unit",

findThumbnail: "situatedObj -> secondBestMatch (match getInOntThumbnail situatedObj) situatedObj",

getName: "namedObjUnit -> UnitK.cons:right (match (UnitK.cons~K.object getInOntName) namedObjUnit)",


//tests

addTest: "a -> b -> returnUnit (add a b)",

butTest: "(bindUnitTwice addTest) (returnUnit 1) (returnUnit 5)",

simpleTest: "returnUnit (returnUnit 1)",


matchTest: "sitObj -> match (UnitK.cons~K.object getInOntThumbnail) sitObj",

unitTest: "getInOntName"

//unitTest: "staticMatch shared.in shared.ont"

};


forEach(exprLib, function(funcString, name){
	addExpr(name, funcString);
});
