template (note::Note) {

  cleanups = state(Set (Action Void)),

  mouseOverSelection = state(Unit Null),
  focus = state(Unit TimeLink),

  collapsed = boolToUnit (isEnoughToCollapse (fetch (length (note_linksToMovies note)))),

  isEnoughToCollapse = function (num::Number) {
    return num > 5;
  },

  getThumbnailURL = function (id::String, time::Number, width::Number, height::Number) {
    return "url(http:/"+"/media.eversplosion.com/frame.php?id="+id+"&time="+time+"&width="+width+"&height="+height+")";
  },
  colorStyle = defaultColorStyle,

  noteId = remoteId note,

  cleanupDiv = action() {
    extract cleanups as cleanup {
      cleanup,
      remove cleanups cleanup
    }
  },

  initDiv = action() {
    cleanupDiv,
    initDiv0 (fetch (note_text note)),
    extract note_linksToMovies note as timeLink {
      addDivTimeLink timeLink
    },
    extract note_linksToNotes note as textLink {
      debug "note-to-note links not yet implemented"
    },
    extract note_linksFromNotes note as textLink {
      debug "note-to-note links not yet implemented"
    }
  },

  addDivTimeLink = action(timeLink::TimeLink)::Void {
    range = textRange_range (timeLink_source timeLink),
    extract range as rangeValue {
      rangeId = remoteId range,
      addDivRange rangeId rangeValue,
      injectDivRangeStyle rangeId "borderColor" (colorStyle_getInner colorStyle (isHighlighted (timeLink_target timeLink))),
      injectDivRangeClass rangeId (reactiveIfThen (isHighlighted (timeLink_target timeLink)) "noteRange-highlighted" "noteRange"),
      addDivRangeEventAction rangeId "mouseover" (set mouseOverLink (timeLink_target timeLink)),
      addDivRangeEventAction rangeId "mouseover" (set focus timeLink),
      addDivRangeEventAction rangeId "mouseout" (unset mouseOverLink),
      timeRange = timeLink_target timeLink,
      movie = timeRange_movie timeRange,
      movieRange = fetch (timeRange_range timeRange),
      addDivRangeEventAction rangeId "mousedown" (jumpToInMovie movie movieRange)
    }
  },

  saveDiv = action() {
    debug "saving...",
    // TODO need to be sure that text and all ranges are saved _atomically_
    // i.e. make a single action to do so...
    text <- getDivText,
    note_setText note text, // doing this first helps, since it will 'initDiv' on other users pretty quick, but still...
    extract note_linksToMovies note as timeLink {
      textRange = timeLink_source timeLink,
      rangeId = remoteId (textRange_range textRange),
      maybeRange <- getDivRange rangeId,
      if boolToUnit (fst maybeRange) as _ {
        textRange_setRange textRange (snd maybeRange)
      } else {
        textRange_unsetRange textRange
      }
    },
    debug "saved."
  },

  updateDivSelection = action() {
    changedSelection <- getSelection,
    changed = fst changedSelection,
    selection = snd changedSelection,
    extract boolToUnit (and changed (greaterThan (range_length selection) 0)) as _ {
      removeDivRange "noteSelection",
      addDivRange "noteSelection" selection,
      divSelect,
      addDivSelectionEventAction "mouseover" (set mouseOverSelection null),
      addDivSelectionEventAction "mouseout" (unset mouseOverSelection)
    }
  },

  linkSelection = action() {
    extract draggingLink as triple {
      maybeSelection <- getDivSelection,
      extract boolToUnit (fst maybeSelection) as _ {
        range = (fetch (tuple3get2 triple), fetch (tuple3get3 triple)),
        movie = tuple3get1 triple,

        timeRange <- createTimeRange movie,
        timeRange_setRange timeRange range,
        textRange <- createTextRange note,
        textRange_setRange textRange (snd maybeSelection),
        timeLink = makeTimeLink textRange timeRange,
        linkTime timeLink,

        addDivTimeLink timeLink,

        saveDiv
      }
    }
  },

  <div>
    <div class="zForeground timeline-note-text-box" style-overflow="auto" style-height="{reactiveIfThen (unitEqual fullscreenNote note) (subtract mainScreenHeight 100) 100}">
      <f:on globalmouseup>
        if mouseOverSelection as _ {
          linkSelection
        } else {
          updateDivSelection
        }
      </f:on>
      <f:on globalkeyup>
        updateDivSelection
      </f:on>
      <f:on blur>
        saveDiv
      </f:on>
      <div class="note" id="{noteId}" contentEditable="true" style-width="100%" style-height="100%" />

      // nasty f:trigger analogues:
      <f:each note_text note as text>
        <f:wrapper>
          <f:on init>
            initDiv
          </f:on>
          <f:on uninit>
            cleanupDiv
          </f:on>
        </f:wrapper>
      </f:each>

    </div>
    <div class="zForeground timeline-note-thumbnail-box" style-overflow="auto">
      <f:each collapsed as _><f:each focus as timeLink>
        movie = timeRange_movie (timeLink_target timeLink),
        aspectRatio = Movie:aspectRatio movie,
        height = 50,
        width = multiply height aspectRatio,
        movieId = Movie:id movie,
        <f:each timeRange_range (timeLink_target timeLink) as range>
          startTime = range_start range,
          <div class="focusedImage">
            <div style-cursor="pointer" style-border="1px solid" style-border-color="{colorStyle_getBorder colorStyle (isHighlighted (timeLink_target timeLink))}" style-width="{width}" style-height="{height}" style-background-image="{getThumbnailURL movieId startTime width height}"></div>
          </div>
        </f:each>
      </f:each></f:each>

      <f:each note_linksToMovies note as timeLink>
        movie = timeRange_movie (timeLink_target timeLink),
        aspectRatio = Movie:aspectRatio movie,
        height = 50,
        width = multiply height aspectRatio,
        movieId = Movie:id movie,

        <f:each timeRange_range (timeLink_target timeLink) as range>
          <div style-float="left" style-margin="4" style-position="relative">
            <f:each collapsed as _>
              <div class="collapsedImg" style-background-color="{colorStyle_getBorder colorStyle (isHighlighted (timeLink_target timeLink))}">
                <f:on mouseover>
                  set focus timeLink
                </f:on>
                <f:on click>
                  jumpToInMovie movie range,
                  scrollToDivRange (remoteId (textRange_range (timeLink_source timeLink)))
                </f:on>
                <f:call>
                  svgEvents (timeLink_target timeLink) false colorStyle
                </f:call>
                <f:each reactiveEqual (fetch focus) (timeLink) as _>
                  <div class="button delete-button">
                    <f:on click>
                      // prompt to delete this link
                      unlinkTime timeLink,
                      saveDiv,
                      initDiv
                    </f:on>
                    <f:call>tooltipInfo "Remove connection"</f:call>
                  </div>
                </f:each>
              </div>
            </f:each>
            <f:each reactiveNot collapsed as _>
              startTime = range_start range,
              <div style-cursor="pointer" style-border="1px solid" style-border-color="{colorStyle_getBorder colorStyle (isHighlighted (timeLink_target timeLink))}" style-width="{width}" style-height="{height}" style-background-image="{getThumbnailURL movieId startTime width height}">
                <f:on click>
                  jumpToInMovie movie range,
                  scrollToDivRange (remoteId (textRange_range (timeLink_source timeLink)))
                </f:on>
                <f:call>
                  svgEvents (timeLink_target timeLink) false colorStyle
                </f:call>
                <div class="button delete-button" style-position="absolute" style-top="2" style-right="2">
                  <f:on click>
                    // prompt to delete this link
                    unlinkTime timeLink,
                    saveDiv,
                    initDiv
                  </f:on>
                </div>
              </div>
            </f:each>
          </div>
        </f:each>
      </f:each>
      <f:each reactiveOr draggingLink draggingLinkTentative as _>
        <div class="drag-new-link" style-float="left" style-margin="4" style-width="55" style-height="44" style-font-size="11" style-padding="3">
          drag here or drag to selected text
          <f:on dragend>
            extract draggingLink as triple {
              range = (fetch (tuple3get2 triple), fetch (tuple3get3 triple)),
              movie = tuple3get1 triple,

              timeRange <- createTimeRange movie,
              timeRange_setRange timeRange range,
              textRange <- createTextRange note,
              linkTime (makeTimeLink textRange timeRange)
            }
          </f:on>
        </div>
      </f:each>
      <div style-clear="both" />
    </div>
  </div>
}