function (width::Number, height::Number, src::String, playTime::Unit Number, play::Unit Null)::XMLP {

  function makeFlashMovie(src, width, height) {
    var mov = createEl("embed");

    function setAtt(name, value) {
      setAttr(mov, name, value);
    }

    setAtt("allowScriptAccess", "always");

    setAtt("width", width);
    setAtt("height", height);

    setAtt("src", "main.swf");
    setAtt("quality", "high");

    setAtt("type", "application/x-shockwave-flash");
    setAtt("pluginspage", "http:/"+"/www.adobe.com/go/getflashplayer");

    return mov;
  }


  var mov = makeFlashMovie(src, width, height);

  var cleanupFuncs = [];


  var playing = false;
  var playingPoller;

  var playTimeInject = evaluateAndInject(playTime, emptyFunction, function (time) {
    if (!playing) {
      mov.setPlayTime(time);
    }
  });
  cleanupFuncs.push(playTimeInject.unInject);


  var playInject = evaluateAndInject(play, emptyFunction, function () {
    function pause() {
      clearInterval(playingPoller);
      mov.setPlay(false);
      playing = false;
    }

    mov.setPlay(true);
    playing = true;
    playingPoller = setInterval(function () {
      if (!mov.getPlay()) {
        pause();
      }
      playTime.control.set(mov.getPlayTime());
    }, 250);
    return function () {
      pause();
    }
  });
  cleanupFuncs.push(playInject.unInject);




  function cleanup() {
    forEach(cleanupFuncs, function (f) {
      f();
    });
  }

  var ret = makeXMLP({node: mov, cleanup: cleanup});

  return ret;
}