var baseEnv = spawnEnv(literalEnv, {
	bindSet: makeFun("(a -> Set b) -> Set a -> Set b", function () {
		
	}),
	returnUnitSet: makeFun("Unit a -> Set a", function () {
		
	}),
	passthru: makeFun("(a -> Bool) -> a -> Unit a", function () {
		
	})
});


baseEnv = spawnEnv(baseEnv, {
	compose: parse("f -> g -> x -> f (g x)"),
	"const": parse("x -> y -> x"),
	swap: parse("f -> x -> y -> f y x")
});