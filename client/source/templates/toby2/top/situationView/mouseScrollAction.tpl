<f:on mousescroll>
  wheelDeltaToMultiplier = function (wd) {
    if (wd > 0) return 1.2;
    else return 1/1.2;
  },
  newTranslateX = function (zoomX, oldTranslateX, multiplier) {
    return zoomX - multiplier * (zoomX - oldTranslateX);
  },
  newTranslateY = function (zoomY, oldTranslateY, multiplier) {
    return zoomY - multiplier * (zoomY - oldTranslateY);
  },

  gs = extract globalScale,
  oldTranslateX = extract globalTranslateX,
  oldTranslateY = extract globalTranslateY,
  width = extract width,
  height = extract height,

  multiplier = wheelDeltaToMultiplier event.wheelDelta,
  add(globalScale, multiply gs multiplier),
  zoomX = subtract event.offsetX (divide width 2),
  zoomY = subtract event.offsetY (divide height 2),
  add(globalTranslateX, newTranslateX zoomX oldTranslateX multiplier),
  add(globalTranslateY, newTranslateY zoomY oldTranslateY multiplier)
</f:on>