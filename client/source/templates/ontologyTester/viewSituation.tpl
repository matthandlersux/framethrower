template (sit::Situation) {
	<div style-marginBottom="10">
		<div>
			<b><f:call>linkToSit sit</f:call></b>
		</div>
		<div style-marginLeft="10">
			Parent:
			<f:each Situation:container sit as container>
				<f:call>linkToSit container</f:call>
			</f:each>
		</div>
		<f:call>
			header = <span>Children</span>,
			underFold = template (_::Null) {
				<div style-marginLeft="30">
					<f:each Situation:contains sit as child>
						viewSituation child
					</f:each>
				</div>
			},
			expandable header underFold
		</f:call>
		<div>
			Pipes (as Instance):
			<f:each Situation:pipesOut sit as pipe>
				viewPipe pipe
			</f:each>
		</div>
		<div>
			Pipes  (as Type):
			<f:each Situation:pipesIn sit as pipe>
				viewPipe pipe
			</f:each>
		</div>
	</div>
}