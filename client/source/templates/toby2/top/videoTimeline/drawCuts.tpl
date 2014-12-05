function (cuts::JSON, multiplier::Number)::XMLP {
  var ret = createEl("div");
  forEach(cuts, function (cut) {
    var d = createEl("div");
    d.className = "ruler-notch-3";
    d.style.left = (cut * multiplier) + "px";
    ret.appendChild(d);
  });
  return makeXMLP({node: ret, cleanup: null});
}