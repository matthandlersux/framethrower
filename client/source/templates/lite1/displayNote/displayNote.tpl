template (note::Note) {
	getThumbnailURL = function (id::String, time::Number, width::Number, height::Number) {
		return "url(http:/"+"/media.eversplosion.com/mrtesting/frame.php?time="+time+"&width="+width+"&height="+height+")";
	},
	<div>
		<div class="zForeground" style-border="1px solid #000" style-margin="4" style-padding="4" style-background-color="#bbb" style-color="#000" style-height="100" style-overflow="auto">
			{note_text note}
		</div>
		<div class="zForeground" style-height="50" style-margin="4">
			<f:each note_linksToMovies note as timeLink>
				movie = timeRange_movie (timeLink_target timeLink),
				aspectRatio = Movie:aspectRatio movie,
				height = 50,
				width = multiply height aspectRatio,
				movieId = "moulinrouge",
				<div style-float="left">
					<f:each timeRange_range (timeLink_target timeLink) as range>
						startTime = range_start range,
						<div style-cursor="pointer" style-border="1px solid blue" style-width="{width}" style-height="{height}" style-background-image="{getThumbnailURL movieId startTime width height}">
							<f:on click>
								jumpToInMovie movie range
							</f:on>
						</div>
					</f:each>
				</div>
			</f:each>
			<div style-clear="both" />
		</div>
	</div>
}