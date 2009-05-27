template (focus::Object, width::Number, height::Number) {
	myleft = state(Unit Number),
	mytop = state(Unit Number),
	mywidth = state(Unit Number),
	myheight = state(Unit Number),	
	
	<div>
		<f:on init>randomLocation myleft mytop mywidth myheight width height</f:on>
		<f:each myleft as myleft><f:each mytop as mytop><f:each mywidth as mywidth><f:each myheight as myheight>		
			<div class="situationView-object" style="left:{myleft};top:{mytop};width:{mywidth};height:{myheight}">
				<f:call>
					drawArtifacts focus
				</f:call>
			</div>
		</f:each></f:each></f:each></f:each>
	</div>
}