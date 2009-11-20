template () {
	<div style-padding="40">
		<f:each allMovies as movie>
			
			<div style-float="left" style-width="120" style-height="180" style-opacity="{reactiveIfThen (isOpen movie) 0.5 1}" style-cursor="pointer">
				<f:on click>
					openMovie movie
				</f:on>
				<div style-width="96" style-height="140" style-background-image="url(http://media.eversplosion.com/covers/Moulin_Rouge.jpg)">
				
				</div>
				{Movie:title movie}
			</div>
		</f:each>
		<div style-clear="both" />
	</div>
}