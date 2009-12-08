template (note::Note) {
	getThumbnailURL = function (id::String, time::Number, width::Number, height::Number) {
		return "url(http:/"+"/media.eversplosion.com/frame.php?id="+id+"&time="+time+"&width="+width+"&height="+height+")";
	},
	colorStyle = defaultColorStyle,
	
	clearMap = action(map::Map k v) {
		extract map as k, _ {
			removeEntry map k
		}
	},
	
	textRangesById = state(Map String TextRange),
	
	noteId = remoteId note,
	
	initDiv = action() {
		setDivText (fetch (note_text note)),
		clearMap textRangesById,
		extract note_linksToMovies note as timeLink {
			addDivTextRange (timeLink_source timeLink)
		},
		extract note_linksToNotes note as textLink {
			addDivTextRange (textLink_source textLink)
		},
		extract note_linksFromNotes note as textLink {
			addDivTextRange (textLink_target textLink)
		}
	},
	
	addDivTextRange = action(textRange::TextRange) {
		range = textRange_range textRange,
		rangeId = remoteId range,
		extract range as rangeValue { // only care about specific selections
			addEntry textRangesById rangeId textRange,
			addDivRange rangeId rangeValue
		}
	},
	
	
	<div>
		<div class="zForeground" style-border="1px solid #000" style-margin="4" style-padding="4" style-background-color="#bbb" style-color="#000" style-height="100" style-overflow="auto">
			<f:on globalmouseup>
				updateDivSelection
			</f:on>
			<f:on globalkeyup>
				updateDivSelection
			</f:on>
			<f:on blur>
				text <- getDivText,
				note_setText note text
				// debug "changed note text"
				// initDiv
			</f:on>
			<f:on dragend>
				extract draggingLink as triple {
					maybeSelection <- getDivSelection,
					extract boolToUnit (fst maybeSelection) as _ {
						range = (fetch (tuple3get2 triple), fetch (tuple3get3 triple)),
						movie = tuple3get1 triple,

						timeRange <- createTimeRange movie,
						timeRange_setRange timeRange range,
						textRange <- createTextRange note,
						textRange_setRange textRange (snd maybeSelection),
						linkTime (makeTimeLink textRange timeRange),
						
						initDiv
					}
				}
			</f:on>
			<div class="note" id="{noteId}" contentEditable="true" style-width="100%" style-height="100%"/>
			
			// nasty f:trigger analogues:
			<f:each note_text note as text>
				<f:wrapper>
					<f:on init>
						// debug "note_text changed",
						initDiv
						// addDivRange "test" (makeRange 5 4)
					</f:on>
				</f:wrapper>
			</f:each>
			<f:each reactiveOr draggingLink draggingLinkTentative as _>
				<f:wrapper>
					<f:on init>
						highlightDivSelection
					</f:on>
					<f:on uninit>
						unhighlightDivSelection
					</f:on>
				</f:wrapper>
			</f:each>

		</div>
		<div class="zForeground">
			<f:each note_linksToMovies note as timeLink>
				movie = timeRange_movie (timeLink_target timeLink),
				aspectRatio = Movie:aspectRatio movie,
				height = 50,
				width = multiply height aspectRatio,
				movieId = Movie:id movie,
				<div style-float="left" style-margin="4" style-position="relative">
					<f:each timeRange_range (timeLink_target timeLink) as range>
						startTime = range_start range,
						<div style-cursor="pointer" style-border="1px solid" style-border-color="{colorStyle_getBorder colorStyle (bindUnit (reactiveEqual (timeLink_target timeLink)) mouseOverLink)}" style-width="{width}" style-height="{height}" style-background-image="{getThumbnailURL movieId startTime width height}">
							<f:on click>
								jumpToInMovie movie range
							</f:on>
							<f:call>svgEvents (timeLink_target timeLink) false colorStyle</f:call>
							<div class="button delete-button" style-position="absolute" style-top="2" style-right="2">
								<f:on click>
									// prompt to delete this link
									unlinkTime timeLink
								</f:on>
							</div>
						</div>
					</f:each>
				</div>
			</f:each>
			<f:each reactiveOr draggingLink draggingLinkTentative as _>
				<div class="drag-new-link" style-float="left" style-margin="4" style-width="44" style-height="44" style-font-size="11" style-padding="3">
					drag here to create link
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