function getAllPosition(node) {
  var left = 0;
  var top = 0;
  var width = node.offsetWidth;
  var height = node.offsetHeight;
  var showing = true;

  var obj = node;

  while (obj !== null && obj !== undefined) {
    if (obj.offsetLeft !== undefined) {


      if (obj.style.overflow === "hidden" || obj.style.overflow === "auto") {

        var leftMinBound = obj.scrollLeft;
        var leftMaxBound = obj.scrollLeft + obj.offsetWidth;
        var topMinBound = obj.scrollTop;
        var topMaxBound = obj.scrollTop + obj.offsetHeight;

        if (left < leftMinBound) {
          width += left - leftMinBound;
          left = leftMinBound;
        }
        if (top < topMinBound) {
          height += top - topMinBound;
          top = topMinBound;
        }
        if (left + width > leftMaxBound) {
          width = leftMaxBound - left;
        }
        if (top + height > topMaxBound) {
          height = topMaxBound - top;
        }

        if (width < 0 || height < 0) {
          showing = false;
          break;
        }
      }


      left += obj.offsetLeft - obj.scrollLeft;
      top += obj.offsetTop - obj.scrollTop;

    }

    if (obj.offsetParent !== undefined) {
      obj = obj.offsetParent;
    } else {
      obj = obj.parentNode;
    }
  }



  // if (width <= 0 || height <= 0) {
  //   showing = false;
  // }

  return [showing, left, top, width, height];
}











function getPosition(node) {
  //changed getPosition so it will handle the weird bugginess of offsetParent seen in firefox
  var obj = node;

  var curleft = curtop = 0;

  var recurse = function() {
    if(obj !== null && obj !== undefined) {
      if(obj.offsetLeft !== undefined) {
        if(obj.scrollTop > 0) {
          console.log(obj.scrollTop);
        }
        curleft += obj.offsetLeft - obj.scrollLeft;
        curtop += obj.offsetTop - obj.scrollTop;
      }
      if (obj.offsetParent !== undefined) {
        obj = obj.offsetParent;
        recurse();
      } else {
        obj = obj.parentNode;
        recurse();
      }
    }
  };
  recurse();

  return [curleft, curtop];
}

function getRelativePosition(node, ancestor) {
  var obj = node;

  var curleft = curtop = 0;

  var recurse = function() {
    if(obj !== null && obj !== undefined) {
      if(obj.offsetLeft !== undefined) {
        curleft += obj.offsetLeft - obj.scrollLeft;
        curtop += obj.offsetTop - obj.scrollTop;
      }

      if (obj.parentNode===ancestor)
        return;

      if (obj.offsetParent !== undefined) {
        obj = obj.offsetParent;
        recurse();
      } else {
        obj = obj.parentNode;
        recurse();
      }
      recurse();
    }
  };
  recurse();

  // if (!obj || obj.parentNode!==ancestor)
  //   console.error("ancestor node not encountered");

  return [curleft, curtop];
}
