template () {
	// intervals from those textpoints, links using the textpoints or intervals
	
	// get infons about, about using role
	// getInfonsAbout :: subject -> Set infon, getInfonsAboutRole :: subject -> role -> Set infon
	// get arguments from an infon
	// infon -> role -> Set subject
	
	
	
	essayText = fetch (Situation:propText essay),
	
	textpoints = filterByType textlinePoint (Situation:contains essay),
	textintervals = filterByType lineInterval (Situation:contains essay),
	
	
	
	textpointInfonPairs = mapSet (textpoint -> (Situation:propTime textpoint, getInfonsAboutRole textpoint ulinkSource)) textpoints :: Set (Unit Number, Set Pipe),
	
	pointsAndLinks = bindSet (pair -> mapUnitSet (mapUnit2 makeTuple2 (fst pair)) (snd pair)) textpointInfonPairs :: Set (Number, Pipe),
	
	
	

	

	
	writeString = template (s::String) {
		<f:wrapper>{s}</f:wrapper>
	},
	writeNewLine = <br style-clear="both" />,
	writePointLink = template (infon::Pipe) {
		class = reactiveIfThen (bindUnit (reactiveEqual infon) hoveredInfon) "essayLinkHover" "essayLink",
		
		<span style-display="inline-block" style-width="13" style-height="13" class="{class}">
			//<img width="13" height="13" src="http://media.eversplosion.com/gradient.php?height=13&color1=f0d&color2=0a34b4">
			
				<f:call>hoveredInfonEvents infon 0</f:call>
			//</img>
		</span>
	},
	writeThumbnails = template (infons::[Pipe]) {
		<div style-float="right" style-margin-right="-370" style-width="350">
			<f:each infons as infon>
				timeObject = fetch (takeOne (getInfonRole ulinkTarget infon)),
				video = fetch (takeOne (bindUnitSet Situation:propVideo (bindSetUnit getAllInherits (Situation:container timeObject)))),
				time = Situation:propTime timeObject,
				intervalInfon = getInfonsAboutRole timeObject lineHasEndpointsBetween,
				intervalStart = bindUnit Situation:propTime (takeOne (bindSet (getInfonRole lineHasEndpointsStart) intervalInfon)),
				
				myReactiveOr = x -> y -> flattenUnit (reactiveIfThen x x y),
				
				imageWidth = 150,
				imageHeight = quotient 150 (ExtVideo:aspectRatio video),
				
				getThumbnailURL = function (id::String, time::Number, width::Number, height::Number) {
					return "url(http:/"+"/media.eversplosion.com/crop.php?file="+id+"-scrub&time="+time+"&width="+width+"&height="+height+")";
				},
				class = reactiveIfThen (bindUnit (reactiveEqual infon) hoveredInfon) "#fc0" "transparent",
				<div style-float="left" style-padding="5" style-border="1px solid #ccc" style-margin="5" style-backgroundColor="{class}">
					<div style-width="150" style-height="{imageHeight}" style-backgroundImage="{getThumbnailURL (ExtVideo:id video) (fetch (myReactiveOr time intervalStart)) imageWidth imageHeight}" />
					<f:call>hoveredInfonEvents infon 0</f:call>
				</div>
				
			</f:each>
			<br style-clear="both" />
		</div>
	},
	
	
	f = function (writeString::String->XMLP, writeNewLine::XMLP, writePointLink::Pipe->XMLP, writeThumbnails::[Pipe]->XMLP, s::String, pointsAndLinks::JSON)::[XMLP] {
		
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
	
	writeList = template (xs::[XMLP]) {
		<f:each xs as x>
			<f:call>x</f:call>
		</f:each>
	},
	<div class="essayLarge" style-margin-right="360">
		<f:call>writeList markup</f:call>
	</div>
}