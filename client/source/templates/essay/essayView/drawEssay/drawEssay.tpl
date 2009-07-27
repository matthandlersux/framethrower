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
	
	
	
	
	
	hoverInfon = template (infon::Pipe) {
		<f:wrapper>
			<f:on mouseover>
				add(hoveredInfon, infon)
			</f:on>
			<f:on mouseout>
				remove(hoveredInfon)
			</f:on>
		</f:wrapper>
	},
	

	
	writeString = template (s::String) {
		<f:wrapper>{s}</f:wrapper>
	},
	writeNewLine = <br style-clear="both" />,
	writePointLink = template (infon::Pipe) {
		target = fetch (takeOne (getInfonRole ulinkTarget infon)),
		time = fetch (Situation:propTime target),
		<span>
			<img width="13" height="13" src="http://media.eversplosion.com/gradient.php?height=13&color1=f0d&color2=0a34b4">
				<f:call>hoverInfon infon</f:call>
			</img>
			({time})
		</span>
	},
	writeThumbnails = template (infons::List Pipe) {
		<div style-float="right" style-margin-right="-350">
			<f:each infons as infon>
				timeObject = fetch (takeOne (getInfonRole ulinkTarget infon)),
				video = fetch (takeOne (bindUnitSet Situation:propVideo (bindSetUnit getAllInherits (Situation:container timeObject)))),
				time = fetch (Situation:propTime timeObject),
				getThumbnailURL = function (id::String, time::Number) {
					return "http:/"+"/media.eversplosion.com/crop.php?file="+id+"-scrub&time="+time;
				},
				class = reactiveIfThen (bindUnit (reactiveEqual infon) hoveredInfon) "#fc0" "transparent",
				<div>
					//{time} - {ExtVideo:id video}
					<img src="{getThumbnailURL (ExtVideo:id video) time}" style-padding="5" style-border="1px solid #ccc" style-margin="5" style-backgroundColor="{class}">
						<f:call>hoverInfon infon</f:call>
					</img>
				</div>
			</f:each>
		</div>
	},
	
	
	f = function (writeString::String->XMLP, writeNewLine::XMLP, writePointLink::Pipe->XMLP, writeThumbnails::List Pipe->XMLP, s::String, pointsAndLinks::JSON)::List XMLP {
		
		// hack to get it to not take so damn long to start up
		if (pointsAndLinks.length < 33) return arrayToList([]);
		
		//console.log("javascript writer being called", pointsAndLinks);
		
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
				out: out(writeNewLine),
				type: "newLine"
			});
		});
		
		forEach(pointsAndLinks, function (pointAndLink) {
			inserts.push({
				index: pointAndLink.asArray[0],
				out: out(writePointLink, pointAndLink.asArray[1]),
				type: "link",
				link: pointAndLink.asArray[1]
			});
		});
		
		inserts.sort(function (a, b) {
			return a.index - b.index;
		});
		
		// put in thumbnail bars
		for (var i = 0; i < inserts.length; i++) {
			if (inserts[i].type === "newLine") {
				var links = [];
				for (var j = i+1; j < inserts.length; j++) {
					if (inserts[j].type === "newLine") break;
					else if (inserts[j].type === "link") {
						links.push(inserts[j].link);
					}
				}
				if (links.length > 0) {
					inserts.splice(i+1, 0, {
						index: inserts[i].index,
						out: out(writeThumbnails, arrayToList(links)),
						type: "thumbnails"
					});
				}
				//console.log("did a newline", links);
			}
		}
		
		
		var index = 0;
		forEach(inserts, function (insert) {
			ret.push(out(writeString, s.substring(index, insert.index)));
			ret.push(insert.out);
			index = insert.index;
		});
		ret.push(out(writeString, s.substring(index)));
		
	
		return arrayToList(ret);
	},
	markup = f writeString writeNewLine writePointLink writeThumbnails essayText (fetch (jsonify pointsAndLinks)),
	
	writeList = template (xs::List XMLP) {
		<f:each xs as x>
			<f:call>x</f:call>
		</f:each>
	},
	<div class="essayLarge" style-margin-right="350">
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