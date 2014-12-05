template (width::Number, height::Number, video::X.video) {
  videoWidth = X.video:width video,
  videoHeight = X.video:height video,
  duration = X.video:duration video,
  url = X.video:url video,


  timeLoaded = state(Unit Number),

  previewTime = state(Unit Number),
  currentTime = state(Unit Number),

  selectionStart = state(Unit Number),
  selectionEnd = state(Unit Number),
  selecting = state(Unit Null),

  selectionMin = mapUnit2 min selectionStart selectionEnd,
  selectionDur = mapUnit2 (x -> y -> abs (subtract x y)) selectionStart selectionEnd,


  zoomWidth = state(Unit Number),

  <f:each videoWidth as videoWidth><f:each videoHeight as videoHeight><f:each duration as duration><f:each url as url>

    drawTimeline = template (width, height) {
      <div class="timeline-container" style-width="{width}" style-height="{height}" style-color="white">
        <f:each zoomWidth as zoomWidth>
          timeMultiplier = divide duration zoomWidth,
          <div class="ruler-container" style-width="{zoomWidth}">
            <f:on mousemove>
              add(previewTime, multiply timeMultiplier event.offsetX)
            </f:on>
            <f:on click>
              add(currentTime, multiply timeMultiplier event.offsetX),
              remove(selectionStart),
              remove(selectionEnd)
            </f:on>

            <f:on mousedown>
              start = multiply timeMultiplier event.offsetX,
              add(selectionStart, start),
              add(selectionEnd, start),
              add(selecting, null),
              remove(currentTime)
            </f:on>
            <f:on mouseup>
              remove(selecting)
            </f:on>
            <f:each selecting>
              <f:on mousemove>
                add(selectionEnd, multiply timeMultiplier event.offsetX)
              </f:on>
            </f:each>

            // <f:each currentTime as currentTime>
            //   <f:on mouseout>
            //     add(previewTime, currentTime)
            //   </f:on>
            // </f:each>

            <div class="timeline-loading" style-width="{mapUnit (swap divide timeMultiplier) timeLoaded}" />


            <f:each X.video:cuts video as cuts>
              <f:call>drawCuts cuts (divide 0.0417083322 timeMultiplier)</f:call>
            </f:each>


            // TODO: decide if this method with defaultValue is faster or slower than f:each and the div gets recomputed

            <div class="ruler-cursor" style-left="{defaultValue -10 (mapUnit (swap divide timeMultiplier) previewTime)}" />

            <div class="ruler-selected" style-left="{defaultValue -10 (mapUnit (swap divide timeMultiplier) currentTime)}" />

            <div class="ruler-selected-range" style-left="{defaultValue -10 (mapUnit (swap divide timeMultiplier) selectionMin)}" style-width="{defaultValue 0 (mapUnit (swap divide timeMultiplier) selectionDur)}" />

            // <f:each selectionStart as selectionStart><f:each selectionEnd as selectionEnd>
            //   t1 = min selectionStart selectionEnd,
            //   t2 = max selectionStart selectionEnd,
            //   <div class="ruler-selected-range" style-left="{divide t1 timeMultiplier}" style-width="{divide (subtract t2 t1) timeMultiplier}" />
            // </f:each></f:each>



          </div>
        </f:each>

      </div>
    },


    drawPreview = template (width, height) {
      <div class="timeline-preview" style-width="{width}" style-height="{height}">
        <f:call>quicktime width height url previewTime timeLoaded</f:call>
      </div>
    },



    ratio = divide videoWidth videoHeight,
    scaledHeight = height,
    scaledWidth = multiply ratio scaledHeight,

    timelineWidth = subtract width scaledWidth,
    timelineControlsWidth = 20,

    <div style-width="{width}" style-height="{height}">
      <f:on init>
        add(zoomWidth, 3000)
      </f:on>
      <div class="timeline-left" style-width="{timelineWidth}" style-height="{height}">
        <div class="timeline-controls" style-width="{timelineControlsWidth}" style-height="{height}">
          <f:each zoomWidth as zoomWidthValue>
            <f:wrapper>
              <div class="button-zoomIn">
                <f:on click>add(zoomWidth, multiply zoomWidthValue 1.5)</f:on>
              </div>
              <div class="button-zoomOut">
                <f:on click>add(zoomWidth, divide zoomWidthValue 1.5)</f:on>
              </div>
            </f:wrapper>
          </f:each>
        </div>
        <div style-position="absolute" style-left="{timelineControlsWidth}">
          <f:call>drawTimeline (subtract timelineWidth timelineControlsWidth) height</f:call>
        </div>
      </div>

      <div style-position="absolute" style-left="{timelineWidth}">
        <f:call>drawPreview scaledWidth scaledHeight</f:call>
      </div>
    </div>
  </f:each></f:each></f:each></f:each>
}