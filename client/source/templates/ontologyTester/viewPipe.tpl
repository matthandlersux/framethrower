template (pipe::Pipe) {
	<div>
	
		<f:call>linkToSit (Pipe:type pipe)</f:call>
		->
		<f:call>linkToSit (Pipe:instance pipe)</f:call>
	
		// <f:each Pipe:type pipe as sit><f:call>linkToSit sit</f:call></f:each>
		// ->
		// <f:each Pipe:instance pipe as sit><f:call>linkToSit sit</f:call></f:each>
		// <div style-marginLeft="10">
		// 	<f:each Pipe:container pipe as _, container>
		// 		<f:call>viewPipe container</f:call>
		// 	</f:each>
		// </div>
	</div>
}