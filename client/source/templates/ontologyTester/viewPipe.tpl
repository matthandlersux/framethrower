template (pipe::Pipe) {
	<div>
		<f:each Pipe:type pipe as sit><f:call>linkToSit sit</f:call></f:each>
		->
		<f:each Pipe:instance pipe as sit><f:call>linkToSit sit</f:call></f:each>
	</div>
}