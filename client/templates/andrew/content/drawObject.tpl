template (focus::Object, pos::SV.shape) {
	<f:each SV.shape:width pos as mywidth><f:each SV.shape:height pos as myheight><f:each SV.shape:left pos as myleft><f:each SV.shape:top pos as mytop>
		<f:wrapper>
			<svg:rect class="situationView-object" width="{mywidth}" height="{myheight}" x="{myleft}" y="{mytop}">
				<f:call>
					dragdrop (SV.shape:left pos) (SV.shape:top pos)
				</f:call>
			</svg:rect>
			<f:call>
				drawArtifacts focus
			</f:call>
		</f:wrapper>
	</f:each></f:each></f:each></f:each>
}