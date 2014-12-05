function (width::Number, height::Number, src::String, gotoTime::Unit Number, timeLoaded::Unit Number) {

  function makeQTMovie(src, width, height, autoplay) {
    var mov = createEl("embed");

    function setAtt(name, value) {
      setAttr(mov, name, value);
    }

    setAtt("width", width);
    setAtt("height", height);
    setAtt("enablejavascript", "true");
    setAtt("postdomevents", "true");
    setAtt("scale", "aspect");
    setAtt("controller", "false");

    if (autoplay) {
      setAtt("autoplay", "true");
    } else {
      setAtt("autoplay", "false");
    }

    setAtt("src", src);
    //setAtt("src", ROOTDIR+"design/images/dummy.mov");
    //setAtt("qtsrc", src);
    //setAtt("qtsrcdontusebrowser", "true");
    //src="dummy.mov" qtsrc="{@src}" qtsrcdontusebrowser="true"

    return mov;

  }


  var mov = makeQTMovie(src, width, height, false);

  var cleanupFuncs = new Array();

  var injectedFunc = evaluateAndInject(gotoTime, emptyFunction, function (time) {
    try {
      mov.SetTime(time * mov.GetTimeScale());
    } catch (e) {

    }
  });

  cleanupFuncs.push(injectedFunc.unInject);

  mov.addEventListener("qt_progress", function () {
    timeLoaded.control.add(mov.GetMaxTimeLoaded() / mov.GetTimeScale());
  }, true);


  function cleanup() {
    forEach(cleanupFuncs, function (f) {
      f();
    });
  }

  var ret = makeXMLP({node: mov, cleanup: cleanup});

  return ret;
}