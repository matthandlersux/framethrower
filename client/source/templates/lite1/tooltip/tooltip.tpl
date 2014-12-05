template () {
  tooltipWidth = 120,
  computeLeftBottom = function (x::Number, y::Number, width::Number, height::Number)::(Number, Number) {
    (x > (width - evalExpr("tooltipWidth"))) ? x = (width - evalExpr("tooltipWidth") - 20) : false;
    return makeTuple2(x, y + 20);
  },
  leftBottom = computeLeftBottom (fetch (UI.ui:mouseX ui.ui)) (fetch (UI.ui:mouseY ui.ui)) (fetch (UI.ui:screenWidth ui.ui)) (fetch (UI.ui:screenHeight ui.ui)),
  left = fst leftBottom,
  bottom = snd leftBottom,

  <f:each tooltipS as t>
    <div class="zTooltip tooltip" style-position="absolute" style-left="{left}" style-top="{bottom}" style-width="{tooltipWidth}">
      {t}
    </div>
  </f:each>
}