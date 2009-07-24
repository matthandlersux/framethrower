action () {
	setEssayText = action (text::String) {
		add(Situation:propText mrEssay, text)
	},

	makeTextPoint = action (char::Number) {
		createTextPoint mrEssay pipeTextlineToMrEssay char
	},
	makeTextRange = action (start::Number, end::Number) {
		tp1 = makeTextPoint start,
		tp2 = makeTextPoint end,
		createInterval mrEssay (cons lineToTextline pipeTextlineToMrEssay) tp1 tp2
	},

	makeVideoPoint = action (time::Number) {
		createTimePoint mrEssayTimeline pipeTimelineToMrEssayTimeline time
	},
	makeVideoRange = action (start::Number, end::Number) {
		tp1 = makeVideoPoint start,
		tp2 = makeVideoPoint end,
		createInterval mrEssayTimeline (cons lineToTimeline pipeTimelineToMrEssayTimeline) tp1 tp2
	},

	makeLink = action (from::Situation, to::Situation) {
		makeInfon2 ulink ulinkSource ulinkTarget mrEssay from to
	},
	
	
	

setEssayText "The first and most \"outer\" nesting is the initial red curtain . (\"Outer\" is a matter of timing and not significance. This enclosure is outer because it begins first and ends last and thus encloses what it contains.)

This is the third film in which Baz has used this red curtain device. It is unusual in that it even wraps the 20th Century logo and has its own entertainment value in a comically animated conductor. This wrapper closes the film with a closing curtain  but you will see this red curtain at other key turning points in the nests: when we are first introduced to the Moulin Rouge ; in Satine's brothel bed in the elephant, where she \"performs ;\" when, in that same room, the players first act out the play ; and when at the end, the play itself is performed .

This curtain wrapper is asymmetric. At the beginning, the curtains open to reveal a faded old movie with the titles. But at the end, the curtains close on a closeup of the typed page of the story Christian has just finished. After it closes, you then have the credits presented in the same faded placards that were inside the curtain before.

The second nest, or wrapper is our  \"outer\" narrator. He appears  after a similar placard tells us that this is Paris, 1900. This time the placard is in reverse, white letters on black: same font, style and border. This outer narrator is another persona of Toulouse-Lautrec, as we will see. He is wearing part of the costume he wears at the end, as the singing \"magical sitar\" who sings a song of love, an elaborate cross-fold role written into the play at several levels of the nesting. He indeed sings the song of love, introducing the hero. Notably Christian is introduced as strange and \"enchanted,\" the enchantment in part being (we discover) pharmaceutical.

This nest ends  just before the curtain layer, with a reappearance of this singer, again outside in front of the windmill. This time, he retains the facial makeup of the magical sitar character, which he -- in the inner play in the movie -- has just been prominent, playing a role much like he does in this outer nest: as the physically high observer of the love tragedy. Again at the end we are reminded that Christian is enchanted and by then we know why: through absinthe.",
v0 = makeVideoPoint 15,
v1 = makeTextPoint 62,
makeLink v1 v0,
v2 = makeVideoPoint 7152,
v3 = makeTextPoint 468,
makeLink v3 v2,
v4 = makeVideoPoint 660,
v5 = makeTextPoint 594,
makeLink v5 v4,
v6 = makeVideoPoint 1574,
v7 = makeTextPoint 657,
makeLink v7 v6,
v8 = makeVideoPoint 2479,
v9 = makeTextPoint 720,
makeLink v9 v8,
v10 = makeVideoPoint 5845,
v11 = makeTextPoint 772,
makeLink v11 v10,
v12 = makeVideoPoint 102,
v13 = makeTextPoint 1183,
makeLink v13 v12,
v14 = makeVideoPoint 7061,
v15 = makeTextPoint 1798,
makeLink v15 v14









}