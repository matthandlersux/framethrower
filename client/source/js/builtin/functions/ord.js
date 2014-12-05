/*

The first string should be "b".

Ordering scheme looks like:

aaab
  aaabb
aab
  aabb
ab
  abb
b
  bab
bb
  bbab
bbb
  bbbab
bbbb

Proof:
  We impose that all strings end in 'b'. Because of this, clearly ord-bigger and ord-smaller work and preserve this invariant.
  Now, consider two strings, s1 and s2 with s1 < s2, we wish to prove that ord-between will indeed produce a string that is in between s1 and s2.
    If one string is longer than the other, we make that one smaller (if s2) or bigger (if s1) to produce s3.
      Without loss of generality, assume we make s1 bigger to produce s3.
      Clearly s3 is bigger than s1, we just need to show it is smaller than s2.
      s3 has the same first n-1 characters as s1 given s1 has length n (because ord-bigger and ord-smaller keep all but the last characters the same)
      Since s1 was longer than s2, we know the first n-1 characters of s3 (and s1) are smaller than s2.
      Therefore, s3 is smaller than s2.
    If both strings are the same length (n), we can either make s1 bigger or s2 smaller to produce s3.
      Assume we make s1 bigger.
      Since all strings end in 'b', we know the first n-1 characters of s1 are smaller the first n-1 characters of s2.
      Since s3 has the same n-1 characters as s1, we know it must be smaller than s2.

*/

(function () {

  var ordOrigin = makeOrd();
  function ordBigger(ref) {
    var value = ref.value.concat(true);
    return makeOrd(value);
  }
  function ordSmaller(ref) {
    var a = ref.value;
    var value = a.slice(0, a.length - 1).concat([false, true]);
    return makeOrd(value);
  }
  function ordBetween(smaller, bigger) {
    if (smaller.value.length > bigger.value.length) {
      return ordBigger(smaller);
    } else {
      return ordSmaller(bigger);
    }
  }

  function numToOrd(num) {
    // takes an integer
    if (num === 0) return ordOrigin;
    else if (num > 0) {
      var ret = [];
      for (var i = 0; i < num; i++) {
        ret.push(true);
      }
      ret.push(true);
      return makeOrd(ret);
    } else {
      var ret = [];
      for (var i = 0; i < -num; i++) {
        ret.push(false);
      }
      ret.push(true);
      return makeOrd(ret);
    }
  }

  addFun("ordBigger", "Ord -> Ord", ordBigger);
  addFun("ordSmaller", "Ord -> Ord", ordSmaller);
  addFun("ordBetween", "Ord -> Ord -> Ord", ordBetween);
  addFun("numToOrd", "Number -> Ord", numToOrd);
  //addFun("ordOrigin", "Ord", ordOrigin);
  base.add("ordOrigin", ordOrigin);

})();