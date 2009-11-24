template () {
	makeCoverUrl = function (id::String)::String {
		return "url(http:/"+"/media.eversplosion.com/video/"+id+"/cover.jpg)";
	},
	<div style-padding="40">
		<div>
			Welcome to Framethrower Lite!<br />
			Choose a movie:<br /><br />
		</div>
		<f:each allMovies as movie>
			
			<div style-float="left" style-width="140" style-height="180" style-opacity="{reactiveIfThen (isOpen movie) 0.5 1}" style-cursor="pointer">
				<f:on click>
					openMovie movie
				</f:on>
				<div class="zBackground" style-position="relative" style-width="96" style-height="140" style-background-image="{makeCoverUrl (Movie:id movie)}">
				
				</div>
				//{Movie:title movie}
			</div>
		</f:each>
		<div style-clear="both" />
	</div>
}