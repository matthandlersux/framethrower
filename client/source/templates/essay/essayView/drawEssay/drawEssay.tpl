template () {
	// intervals from those textpoints, links using the textpoints or intervals
	
	// get infons about, about using role
	// getInfonsAbout :: subject -> Set infon, getInfonsAboutRole :: subject -> role -> Set infon
	// get arguments from an infon
	// infon -> role -> Set subject
	
	
	
	essayText = fetch (Situation:propText essay),
	
	textpoints = filterByType textlinePoint (Situation:contains essay),
	textintervals = filterByType lineInterval (Situation:contains essay),
	
	
	
	textpointInfonPairs = mapSet (textpoint -> makeTuple2 (Situation:propTime textpoint) (getInfonsAboutRole textpoint ulinkSource)) textpoints :: Set (Tuple2 (Unit Number) (Set Pipe)),
	
	pointsAndLinks = bindSet (pair -> mapUnitSet (mapUnit2 makeTuple2 (fst pair)) (snd pair)) textpointInfonPairs :: Set (Tuple2 Number Pipe),
	
	//(mapSet Situation:propTime textpoints)
	
	//getInfonsAboutRole tp ulinkSource
	
	
	
	
	
	
	

	
	writeString = template (s::String) {
		<f:wrapper>{s}</f:wrapper>
	},
	writeNewLine = <br />,
	writePointLink = template (infon::Pipe) {
		<img width="13" height="13" src="http://media.eversplosion.com/gradient.php?height=13&color1=f0d&color2=0a34b4">
		
		</img>
	},
	
	
	
	f = function (writeString::String->XMLP, writeNewLine::XMLP, writePointLink::Pipe->XMLP, s::String, pointsAndLinks::JSON)::List XMLP {
		var ret = [];
		
		function out() {
			return evaluate(makeApplyWith.apply(null, arguments));
		}
		
		
		function findAll(needle, haystack) {
			var ret = [];
			var i = 0; var len = haystack.length;
			while (i < len) {
				i = haystack.indexOf(needle, i);
				if (i === -1) break;
				ret.push(i);
				i++;
			}
			return ret;
		}
		
		var newLines = findAll(hackNewLine, s);
		
		var inserts = [];
		
		forEach(newLines, function (i) {
			inserts.push({
				index: i,
				out: out(writeNewLine)
			});
		});
		
		forEach(pointsAndLinks, function (pointAndLink) {
			inserts.push({
				index: pointAndLink.asArray[0],
				out: out(writePointLink, pointAndLink.asArray[1])
			});
		});
		
		inserts.sort(function (a, b) {
			return a.index - b.index;
		});
		
		var index = 0;
		forEach(inserts, function (insert) {
			ret.push(out(writeString, s.substring(index, insert.index)));
			ret.push(insert.out);
			index = insert.index;
		});
		ret.push(out(writeString, s.substring(index)));
		
	
		return arrayToList(ret);
	},
	markup = f writeString writeNewLine writePointLink essayText (fetch (jsonify pointsAndLinks)),
	
	writeList = template (xs::List XMLP) {
		<f:each xs as x>
			<f:call>x</f:call>
		</f:each>
	},
	<div class="essayLarge">
		<div>
			<f:call>writeList markup</f:call>
		</div>
		<ol>
			<f:each textpoints as tp>
				<li>
					textpoint: {Situation:propTime tp}, {length (getInfonsAboutRole tp ulinkSource)}
					<f:each getInfonsAboutRole tp ulinkSource as infon>
						target = fetch (takeOne (getInfonRole ulinkTarget infon)),
						<b>{Situation:propName target}</b>
					</f:each>
				</li>
			</f:each>
		</ol>
		<div>{length pointsAndLinks}</div>
	</div>
}