action (infon::Pipe, x::Number, y::Number, direction::Number) {



  content = <div>
    <f:call>
      timeObject = fetch (takeOne (getInfonRole ulinkTarget infon)),
      video = fetch (takeOne (bindUnitSet Situation:propVideo (bindSetUnit getAllInherits (Situation:container timeObject)))),

      time = Situation:propTime timeObject,
      intervalInfon = getInfonsAboutRole timeObject lineHasEndpointsBetween,
      intervalStart = bindUnit Situation:propTime (takeOne (bindSet (getInfonRole lineHasEndpointsStart) intervalInfon)),
      intervalEnd = bindUnit Situation:propTime (takeOne (bindSet (getInfonRole lineHasEndpointsEnd) intervalInfon)),

      myReactiveOr = x -> y -> flattenUnit (reactiveIfThen x x y),

      start = myReactiveOr intervalStart (mapUnit (swap subtract 2) time),
      end = myReactiveOr intervalEnd (mapUnit (plus 2) time),
      duration = mapUnit2 subtract end start,

      <f:each start as start>
        <f:each duration as duration>
          <f:call>drawVideoPlayer video start duration 400</f:call>
        </f:each>
      </f:each>
    </f:call>

    <f:call>
      textObject = fetch (takeOne (getInfonRole ulinkSource infon)),
      point = fetch (Situation:propTime textObject),
      text = fetch (bindUnit Situation:propText (Situation:container textObject)),

      getSentence = function (text, point)::String {
        var nextPeriod = text.indexOf(".", point);
        if (nextPeriod === -1) nextPeriod = text.length;
        var lastPeriod = text.lastIndexOf(".", point-1);

        return text.substring(lastPeriod+1, nextPeriod+1);
      },

      <div>
        {getSentence text point}
      </div>
    </f:call>
  </div>,
  pop <- create(Popup, {content: content, x: x, y: y, direction: direction, width: 400, height: 300}),
  set popup pop
}