template () {
	Changer = state(Unit String, "default"),
	<div>
		<f:each Changer as Changer>
			<div>
				This feach Changer as Changer causes the bad behavior... Changer is: {Changer}
			</div>
		</f:each>
		<div>
			This input changes:
			<f:each Changer as Changer>
				<input type="text" value="{Changer}" />
			</f:each>
		</div>
		<div>
			This input doesnt:
			<input type="text" value="{Changer}" />
		</div>
		<div>
			Click to make input say Hello
			<f:on click>
				add(Changer, "Hello")
			</f:on>
		</div>
		<div>
			Click to make input say Goodbye
			<f:on click>
				add(Changer, "Goodbye")
			</f:on>
		</div>		
	</div>
}