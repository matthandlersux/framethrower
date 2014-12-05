template() {
  getText = jsaction()::String {
    return document.getElementById("text").value;
  },

  Change := (Number, Number),
  change_origin = fst,
  change_delta = snd,
  // find the coordinates of an insertion or deletion of a single interval:
  findChange = function(s0::String, s1::String)::Change {
    var n = Math.min(s0.length, s1.length);
    // i = index of first difference:
    for (var i=0; i<n && s1[i]===s0[i]; i++);
    return makeTuple(i, s1.length-s0.length);
  },

  Textrange := (Number, Number),
  textrange_start = fst,
  textrange_duration = snd,
  substr = function(s::String, start::Number, duration::Number)::String {
    return s.substr(start,duration);
  },

  updateRange = function(range::Textrange, change::Change)::Textrange {
    var start = range.asArray[0], end = start + range.asArray[1],
      origin = change.asArray[0], delta = change.asArray[1];

    if (delta===0) return range;
    if (delta>0) { // insertion
      if (start >= origin) start += delta;
      if (end > origin) end += delta;
    } else { // deletion
      if (start > origin) {
        if (start <= origin-delta) start = origin;
        else start += delta;
      }
      if (end > origin) {
        if (end <= origin-delta) end = origin;
        else end += delta;
      }
    }
    return makeTuple(start, end-start);
  },

  debugString = jsaction(s::String)::Void {
    console.debug(s);
  },
  debugPair = jsaction(p::(a, b))::Void {
    console.debug(p.asArray);
  },

  textChanged = action() {
    newText <- getText,
    debugString oldText,
    debugString newText,
    change = findChange oldText newText,
    debugPair change,
    debugPair range,
    set rangeS (updateRange range change),
    debugPair range,
    set oldTextS newText
  },

  oldTextS = state(Unit String, "Harold"),
  oldText = fetch oldTextS,
  rangeS = state(Unit Textrange, (0,6)),
  range = fetch rangeS,

  <f:wrapper>
    <textarea id="text" cols="80" rows="20">
      <f:on keypress>textChanged</f:on>
      <f:on blur>textChanged</f:on>
      <f:on change>textChanged</f:on>
      Harold
    </textarea>
    {substr oldText (textrange_start range) (textrange_duration range)}
    {fst range}
    {snd range}
  </f:wrapper>
}