template (items::List (TimeRange, a)) {

  height = 20,

  // This is a magic constant. Experiment with it to get the best performance.
  imagesPerDivision = 39,

  count = function (xs::List a)::Number {
    return xs.asArray.length;
  },
  divisions = round (divide (count items) imagesPerDivision),

  getShown = function (start::Number, duration::Number, tStart::Number, tDuration::Number)::Bool {
    return start <= tStart+tDuration && start+duration >= tStart;
  },

  <f:each divideStamps divisions items as div>
    shown = fetch (lowPassFilter (unfetch (getShown (fst (fst div)) (snd (fst div)) timelineShownStart timelineShownDuration))),

    <div style-display="{boolToDisplay shown}">
      <f:each snd div as cut>
        start = fst (fst cut),
        duration = snd (fst cut),
        myXMLP = template () {
          outString = function (s::a)::XMLP {
            var xml;
            if (typeof s === "string") {
              xml = parseXML("<html:pre>"+s.replace(/\n/g,"<html:br />")+"</html:pre>");
              //xml = unserializeXML("<b style='font-family:courier'>"+s+"888<br />asdf</b>");
            } else {
              xml = unserializeXML("<span />");
            }
            return makeXMLP({node: xml, cleanup: null});
          },
          outString (snd cut)
        },
        <div style-top="2" style-left="{makePercent (divide start movieDuration)}" style-width="{makePercent (divide duration movieDuration)}" style-height="{height}" style-background-color="#60c" style-position="absolute">
          <f:on mouseover>
            set mouseOveredTimeS (start, duration),
            //showTooltip event.mouseX event.mouseY 300 100 false myXMLP
          </f:on>
          <f:on mouseout>
            unset mouseOveredTimeS,
            //hideTooltip
          </f:on>
          <f:on click>
            set selectedTimeStartS start,
            set selectedTimeDurationS duration
          </f:on>
        </div>
      </f:each>
    </div>
  </f:each>
}