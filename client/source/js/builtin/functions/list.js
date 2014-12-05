(function () {
  var nil = makeList([]);

  function cons(head, tail) {
    var newArray = [head].concat(tail.asArray);
    return makeList(newArray);
  }

  function head(list) {
    if (list.asArray.length === 0) {
      debug.error("Trying to take head of empty list");
    }
    return list.asArray[0];
  }
  function tail(list) {
    if (list.asArray.length === 0) {
      debug.error("Trying to take tail of empty list");
    }
    return makeList(list.asArray.slice(1));
  }

  function append(list1, list2) {
    return makeList(list1.asArray.concat(list2.asArray));
  }

  base.add("nil", nil);
  addFun("cons", "a -> [a] -> [a]", cons);
  addFun("head", "[a] -> a", head);
  addFun("tail", "[a] -> [a]", tail);
  addFun("append", "[a] -> [a] -> [a]", append);
})();