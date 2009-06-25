//template (focus::a, print::a -> XMLP, getChildren::a -> Set b) {
template (focus, print, getChildren) {
	expanded = state(Unit Null),
	<div class="outline">
		<f:each expanded as _>
			<div class="outline-expanded">
				<f:on click>remove(expanded)</f:on>
			</div>
		</f:each>
		<f:each reactiveNot expanded as _>
			<div class="outline-collapsed">
				<f:on click>add(expanded, null)</f:on>
			</div>
		</f:each>
		
		<div class="outline-entry">
			<f:call>print focus</f:call>
		</div>
		<f:each expanded as _>
			<div class="outline-children">
				<f:each getChildren focus as child>
					<f:call>outline child print getChildren</f:call>
				</f:each>
			</div>
		</f:each>
	</div>
}