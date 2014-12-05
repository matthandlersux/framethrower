template (pop::Popup) {
  screenWidth = fetch (UI.ui:screenWidth ui.ui),
  screenHeight = fetch (UI.ui:screenHeight ui.ui),

  width = Popup:width pop,
  height = Popup:height pop,
  x = Popup:x pop,
  y = Popup:y pop,
  direction = Popup:direction pop,

  content = Popup:content pop,

  triangleSize = 20,
  padding = 6,

  print = template (top, left, bottom, right) {
    <div style-position="absolute" style-backgroundColor="#fff" style-border="1px solid #ccc" style-padding="{padding}" style-width="{width}" style-top="{top}" style-left="{left}" style-bottom="{bottom}" style-right="{right}">
      <f:call>content</f:call>
    </div>
  },

  printHorizontal = template (x, y) {
    <div style-position="absolute" style-left="{x}" style-top="{subtract y 400}" style-height="800" style-display="table">
      <div style-display="table-cell" style-verticalAlign="middle">
        <div style-width="{width}" style-backgroundColor="#fff" style-border="1px solid #ccc" style-padding="{padding}">
          <f:call>content</f:call>
        </div>
      </div>
    </div>
  },

  printVertical = template (x, top, bottom) {
    <div style-position="absolute" style-left="{x}" style-top="{top}" style-bottom="{bottom}" style-width="{width}" style-backgroundColor="#fff" style-border="1px solid #ccc" style-padding="{padding}">
      <f:call>content</f:call>
    </div>
  },

  js = function (printHorizontal, printVertical, screenWidth, screenHeight, width, height, x, y, direction, triangleSize, padding)::XMLP {
    if (direction === 0) {
      // var top="auto", bottom="auto";
      // if (height - triangleSize > y) {
      //   top = 0;
      // } else {
      //   bottom = screenHeight - y - triangleSize;
      // }
      //
      var left;
      var top = "auto", bottom="auto";
      if (y > screenHeight / 2) {
        bottom = Math.min(screenHeight, screenHeight - y - triangleSize);
      } else {
        top = Math.max(0, y - triangleSize);
      }
      if (screenWidth < x + triangleSize + width) {
        left = x - width - triangleSize - padding;
      } else {
        left = x + triangleSize + padding;
      }
      return evaluate(makeApplyWith(printVertical, left, top, bottom));
      //return evaluate(makeApplyWith(printHorizontal, left, y));
    } else {
      var left = Math.max(0+padding, Math.min(screenWidth - width - padding, x - width/2));
      var top = "auto", bottom="auto";
      if (y > screenHeight / 2) {
        bottom = screenHeight - y + triangleSize + padding;
      } else {
        top = y + triangleSize;
      }
      return evaluate(makeApplyWith(printVertical, left, top, bottom));
    }
  },

  <div style-position="absolute" style-top="0" style-left="0" style-width="{screenWidth}" style-height="{screenHeight}">
    <f:on click>
      unset popup
    </f:on>
    <div>
      <f:on click></f:on>
      <f:call>
        js printHorizontal printVertical screenWidth screenHeight width height x y direction triangleSize padding
      </f:call>
    </div>
    <div style-position="absolute" style-top="{y}" style-left="{x}" style-backgroundColor="#000" style-width="2" style-height="2" />
  </div>
}