


(function () {
  var exprLib = {
    // ========================================================================
    // Basic utility
    // ========================================================================

    compose: {
      type: "(b -> c) -> (a -> b) -> a -> c",
      expr: "f -> g -> x -> f (g x)"
    },
    identity: {
      type: "a -> a",
      expr: "x -> x"
    },
    swap: {
      type: "(a -> b -> c) -> b -> a -> c",
      expr: "f -> x -> y -> f y x"
    },

    // ========================================================================
    // Monadic utility
    // ========================================================================

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
    },
    flattenUnitSet: {
      type: "Unit (Set a) -> Set a",
      expr: "compose flattenSet returnUnitSet"
    },
    flattenSetUnit: {
      type: "Set (Unit a) -> Set a",
      expr: "compose flattenSet (mapSet returnUnitSet)"
    },
    bindUnitSet: {
      type: "(a -> Unit b) -> Set a -> Set b",
      expr: "f -> bindSet (compose returnUnitSet f)"
    },
    bindSetUnit: {
      type: "(a -> Set b) -> Unit a -> Set b",
      expr: "f -> compose (bindSet f) returnUnitSet"
    },
    mapUnitSet: {
      type: "(Unit a -> Unit b) -> Set a -> Set b",
      expr: "f -> bindUnitSet (x -> f (returnUnit x))"
    },


    // ========================================================================
    // Bool/Reactive Bool (Unit a) utility
    // ========================================================================

    reactiveEqual: {
      type: "a -> a -> Unit Null",
      expr: "x -> y -> boolToUnit (equal x y)"
    },


    // ========================================================================
    // Set utility
    // ========================================================================

    isNotEmpty: {
      type: "Set a -> Unit Null",
      expr: "compose reactiveNot isEmpty"
    },

    passthru: {
      type: "(a -> Unit b) -> a -> Unit a",
      expr: "pred -> x -> gate (pred x) x"
    },

    filter: {
      type: "(a -> Unit b) -> Set a -> Set a",
      expr: "pred -> bindSet (compose returnUnitSet (passthru pred))"
    },

    length: {
      type: "Set a -> Unit Number",
      expr: "fold (x -> sum -> plus sum 1) (x -> sum -> subtract sum 1) 0"
    },

    contains: {
      type: "Set a -> a -> Unit Null",
      expr: "s -> elem -> gate (takeOne (filter (reactiveEqual elem) s)) null"
    },

    // ========================================================================
    // Map utility
    // ========================================================================

    takeLastVal: {
       type: "Map a b -> Unit b",
       expr: "m -> bindUnit ((swap getKey) m) (takeLast (keys m))"
    },

    takeLastKey: {
      type: "Map a b -> Unit a",
      expr: "m -> takeLast (keys m)"
    },

    unfoldMapInv: {
      type: "(a -> Set a) -> a -> Map Number (Set a)",
      expr: "f -> x -> invert (mapMapValue returnSet (unfoldMap f x))"
    },

    // ========================================================================
    // Tuple utility
    // ========================================================================

    fst: {
      type: "(a, b) -> a",
      expr: "tuple -> tuple2get1 tuple"
    },
    snd: {
      type: "(a, b) -> b",
      expr: "tuple -> tuple2get2 tuple"
    }

  };

  forEach(exprLib, function (exprEntry, name) {
    addExpr(name, exprEntry.type, exprEntry.expr);
  });

})();

