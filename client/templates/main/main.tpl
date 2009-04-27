template () {
	// this is a JSFUNC:
	jsfun = function (a::Number)::Number {
		return a * 2;
	},
	result = jsfun 5,

	<div>
		<div>
			Here is the result: {result}
		</div>
		<div>
			Here is (letfile1 result):
		 	<f:call>
				letfile1 result
			</f:call>
		</div>
		<div>
			Here is (subfolder1 result):
		 	<f:call>
				subfolder1 result
			</f:call>
		</div>		
	</div>
}