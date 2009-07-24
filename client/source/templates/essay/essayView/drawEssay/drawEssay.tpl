template () {
	// intervals from those textpoints, links using the textpoints or intervals
	
	// get infons about, about using role
	// getInfonsAbout :: subject -> Set infon, getInfonsAboutRole :: subject -> role -> Set infon
	// get arguments from an infon
	// infon -> role -> Set subject
	
	
	
	
	
	textpoints = filterByType textlinePoint (Situation:contains essay),
	textintervals = filterByType lineInterval (Situation:contains essay),
	
	listLast = xs -> head xs, // TODO fix this
	getLastParentPipe = pipe -> mapUnit listLast (Pipe:container pipe),
	
	getInfonsAboutRole = subject -> role -> bindUnitSet getLastParentPipe (filter (pipe -> reactiveEqual role (Pipe:type pipe)) (Situation:asInstance subject)),
	
	
	writeString = template (s::String) {
		<f:wrapper>{s}</f:wrapper>
	},
	writeNewLine = <br />,
	
	
	
	//markup = {
		f = function (writeString::String->XMLP, writeNewLine::XMLP, s::String)::List XMLP {
			var ret = [];
			
			function out() {
				ret.push(evaluate(makeApplyWith.apply(null, arguments)));
			}
			
			out(writeString, s);
			out(writeString, " 8888899");
		
			return arrayToList(ret);
		},
		markup = f writeString writeNewLine,
	//},
	writeList = template (xs::List XMLP) {
		<f:each xs as x>
			<f:call>x</f:call>
		</f:each>
	},
	<div>
		{Situation:propText essay}
		<div>
			blah
			<f:call>writeList (markup "bewrwerewr")</f:call>
		</div>
		<ol>
			<f:each textpoints as tp>
				<li>
				textpoint: {Situation:propTime tp}, {length (getInfonsAboutRole tp ulinkSource)}
				
				</li>
			</f:each>
		</ol>
	</div>
}