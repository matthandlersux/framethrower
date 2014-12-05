
// ============================================================================
// NOTE: the following functions are the interface through which the system interprets literals.
// But also make sure to modify browser/desugar.xml write-select if adding new literals.
// ============================================================================

// String -> Literal
function parseLiteral(s) {
  if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(s)) {
    // matches a number
    // using http://www.regular-expressions.info/floatingpoint.html
    // might want to find the regular expression that javascript uses...
    return +s;
  } else if (/^"[^]*"$/.test(s)) {
    // matches a string
    var sub = s.substring(1, s.length - 1);
    return sub.replace(/\\(["\\])/g, "$1");
  // } else if (/^</.test(s)) { // might want to make this check that the xml is well-formed?
  //   return unserializeXML(s);
  } else if (s === "true") {
    return true;
  } else if (s === "false") {
    return false;
  } else {
    return undefined;
  }
}

// Literal -> String
function unparseLiteral(expr) {
  var t = typeOf(expr);
  if (t === "string") {
    return '"' + expr.replace(/(["\\])/g, "\\$1") + '"';
  } else if (t === "number") {
    if (isNaN(expr)) {
      return "NaN";
    }
    return expr; // this is an optimization hack that takes advantage of javascript's automatic toString when necessary functionality
  } else if (t === "boolean") {
    return expr.toString();
  // } else if (expr.nodeType) {
  //   return serializeXML(expr);
  } else {
    return undefined;
  }
}