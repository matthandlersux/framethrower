//hello
template () {
	// ==============================================================
	// Util Functions
	// ==============================================================	
	
	StringLength = function(s::String)::Number {
		return s.length
	},
	
	SubString = function(s::String, l::Number)::String {
		return s.substr(0, l);
	},
	
	// ==============================================================
	// Population Init
	// ==============================================================
	
	Docs = state {
		Docs <- create(Set String),
		add Docs "A lovely day to walk around the park.",
		add Docs "When I use a word, Humpty Dumpty said in rather a scornful tone, it means just what I choose it to mean -- neither more nor less.",
		add Docs "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to heaven, we were all going direct the other way - in short, the period was so far like the present period, that some of its noisiest authorities insisted on its being received, for good or for evil, in the superlative degree of comparison only.",
		add Docs "The Architect - The first matrix I designed was quite naturally perfect, it was a work of art, flawless, sublime. A triumph equaled only by its monumental failure. The inevitability of its doom is as apparent to me now as a consequence of the imperfection inherent in every human being, thus I redesigned it based on your history to more accurately reflect the varying grotesqueries of your nature. However, I was again frustrated by failure. I have since come to understand that the answer eluded me because it required a lesser mind, or perhaps a mind less bound by the parameters of perfection. Thus, the answer was stumbled upon by another, an intuitive program, initially created to investigate certain aspects of the human psyche. If I am the father of the matrix, she would undoubtedly be its mother.",
		// add(Docs, "The most original and groundbreaking movie of recent history, 3 February 2003 Author: emandal_maggs@yahoo.com from Seattle, WA I have seen Moulin Rouge at least 25 times. I think it is the most extraordinary movie of my generation and breaks every limit set by the industry. I have heard all the traditional complaints people didn't like the music, the editing was too swift, or it wasnt their taste. Moulin Rouge took a risk. A risk films like A Beautiful Mind and Shakespeare in Love don't. It risked by being controversial. To make a likeable movie isn't hard, follow the Hollywood mold and stick in a few attractive actors, some bland dialogue and viola you have a film. Moulin Rouge was made knowing that not everyone would like it, but knowing everyone would at least appreciate it for its artistic ingenuity. Visually it is superb, an indulgent feast for the eyes with every breathtaking, artistic scene. Everything about it is over the top, every scene more stunning than the next, and as it continues your heart becomes more and more intertwined in the love story. The editing in the Roxanne scene rushes through your body and is the most incredible of any movie in history. Nicole Kidman and Ewan McGreggor are the most passionate on-screen couple; entirely convincing as their voices meld them together into one. Never has a movie done what Moulin Rouge did. It realized that the world of film is only being represented in one small way, whereas Moulin Rouge uses a camera and screen to make something bigger and more extraordinary than has ever been made before. It pushes against the confines of convention and leaves you breathless."),
		// add(Docs, "A stunning, visual feast, 12 June 2001		Author: Kekoa Kaluhiokalani (camembertman@yahoo.com) from Columbus, Ohio		At the risk of sounding overly bombastic, 'Moulin Rouge' is the best film I've seen all year, perhaps the best one I've seen in over a year. It is operatic in the best sense of the word, being at once massively outlandish and deeply personal. It is clear that a lot of people took career risks in choosing this film, and although 'Moulin Rouge' may not rack up a huge box office, I think this film will become a classic alongside his other two films 'Strictly Ballroom' and 'Romeo + Juliet.'		In the showing of 'Moulin Rouge' I saw last week, at least 5 people walked out. At the same time I heard audience members audibly gasping at the films visuals and talking back to the screen. The source of these strong reactions? Baz Luhrmann's confidence in his garish cinematic vision and the commitment his actors have in him. The cast fills their roles with relish, even when the entire scene totters on the edge of overkill--but oddly enough, it is the focus that sets 'Moulin Rouge' apart from other films these days. Whereas some actors sleepwalk through their roles as they collect their paychecks, everything about 'Moulin Rouge' is done in earnest.		This movie is the anti-'Pearl Harbor,' because instead of being a hodgepodge of market-tested ideas, 'Moulin Rouge' presents a bold vision and dares the audience to accept or reject it. I, for one, accepted it with delight. A telling comparison: Luhrmann has Nicole Kidman and Ewen MacGregor sing the film's love song. Very daring. For 'Pearl Harbor' Michael Bay chose Faith Hill. Very safe. Too safe. Can you imagine Ben Afleck belting out 'There You'll Be'?		'Moulin Rouge' glitters with such bold decisions. It is a sumptuous feast for ear and eye featuring gorgeous costumes, intricate sets (Nicole Kidman's boudoir in a gigantic elephant is a case in point), and outlandishly choreographed dance numbers are paraded with frenetic relish. And the music, the MUSIC! As you probably know by now, Luhrmann has thrown into his period piece a collage of musical snippets from, among many bits, 'The Sound of Music,' Madonna, The Police, and Elton John. In most cases, no one song gets performed without intersplicing. Witness Luhrmann's audacity: the opening number includes a melding of Labelle's 'Lady Marmalade' with Nirvana's 'Smells Like Teen Spirit.' And here's the spooky part: it works.		The entire movie plays this way, and for the most part it works. Most surpising is that 'Moulin Rouge' has a solid, deeply sincere emotional core. Although the film professes to be about love, I'd add that it is equally about loss. The Moulin Rouge is a playground where adults pretend they are children with the added spice of sensuality.		All the performances are excellent, but the hidden gem is Jim Broadbent as Zidler. Broadbent for years has been doing majestically understated supporting work, from 'Brazil' to 'Enchanted April' to 'Topsy-Turvy.' In 'Moulin Rouge' he manages to be both repulsive and endearing. His spirited rendition of 'Like a Virgin' is classic. Too bad it's not on the soundtrack.		Expect to be overwhelmed by 'Moulin Rouge' in the most unexpected, delightful ways. It will make you wonder why other films can't or won't dare to be that bold."),		
		// add(Docs, "I am in love with 'Moulin Rouge'!, 31 August 2001		Author: Rob from New York, NY		I have not ever felt for a movie the way I do about 'Moulin Rouge.' It is not just a movie...it is a cinematic experience the likes of which I have never before seen. The story, the music, the acting, the visual imagery strikes emotion in me I never before thought possible from a film. It is without a doubt the most brilliant piece of cinematic art I have ever seen. It is dizzy, maddening, beautiful, and heartbreaking! The music is rapturous, and Ewan McGregor and Nicole Kidman's voices compliment each other and the story perfectly. This movie takes its story to a mythic level and surrounds these two star-crossed lovers with music and imagery that simply will take your breath away. The story is grand, huge, and operatic, as is the music. The brilliant score skillfully weaves many modern, popular songs, and rescores them as the libretto to this grand opera. There are some images in this film unlike anything you have ever seen. And the performances are absolutely incredible, particularly Nicole Kidman's. I truly felt for these two people, and truly felt that they were in love. My heart broke into a million pieces for them every time I saw this movie, and I've seen it 8 times. It's an absolutely breathtaking, visionary, masterpiece that did not get the credit it deserved by American critics, who seem to complain that every movie is the same. Yet when an original, daring, shocking film like this comes along, they don't know what to do with it. But then again, this really is not just a film. No mere film could strike me the way this one has, in a way that reaches to the very fibres of my being in a way only 'The Wizard of Oz' ever has before. Yes, the story is sad, but what a journey it takes you on! A journey I will be sure to repeat over and over and over again."),		
		// add(Docs, "One of the few movies out there worth watching several times, just because of the sheer visual and musical enchantment. **** (out of four), 16 June 2001		Author: Blake French (baffilmcritic@cs.com) from USA		MOULIN ROUGE! / (2001) **** (out of four)		By Blake French:		'Moulin Rouge!' revives our imagination and relives the musical era of Hollywood. The film is like an extravagant, expensive Broadway production on screen, with enough open courage, engrossing passion, and zesty energy for several motion pictures. It's one of the year's best films; 'Moulin Rouge!' may be a cliche-ridden love triangle, but Baz Luhrmann, the film's director, shines a fresh, stunning originality on a familiar plot. He creates a candid, exuberant style for his characters-a mixture between a fast-paced music video and lush, exotic images. He uses a vast variety of camera placements and shooting angles. In several of the songs, he cuts on nearly every word. This does indeed make us dizzy, but it is the perfect approach to the material. 		From the opening moments, 'Moulin Rouge!' plays full force, overpowering our senses. The film doesn't even wait for its opening credits to begin. The usual 20th Century Fox logo appears on the screen within a screen as a little bald musician rises from the bottom, and continues to frantically conduct the traditional Fox fanfare. From this, we cut to 'The Sound of Music,' where young writer morns over the loss of his true love. The film includes an interesting use of the bookend structure, and I like how it reveals the information about the main character's deadly disease early. This is the kind of movie that does not need to astonish us with sudden plot twists or unexpected character revelations. The joy of watching 'Moulin Rouge!' is in the visual stimulation; the plot is more interested in its own character's discoveries than playing mind games with the audience.		Ewan McGregor and Nicole Kidman prove that they can really sing. Most of the time, celebrity singers turn to the silver screen with a lot of star power but little acting ability. Look at LL Cool J, Ice Cube, Jennifer Lopez, and I just know Brittany Spears is going to turn up in a movie one of these days. 'Moulin Rouge' may be one of the first movies to open musical doors for its leading performers. Even Jim Broadbent proves to be well cast in a crazy, intensified character that he really sinks his teeth into. I will never look at any of these stars in the same light again, even, to my great reluctance, John Leguizamo.		The film takes place in the early 19th century, as Christian (McGregor) enters Paris hoping to write love stories. Several peculiar figures live above him, including the French artist Toulouse-Lautrec (Leguizamo) and his Bohemian troupe attempting to construct a play. After a freak accident, Christian is suddenly thrust into the middle of their play. The crew hires him as the star writer. He then takes a visit to the flirtatious Moulin Rouge night club, ran by the robust Harold Zinder (Jim Broadbent). It is here where he tries to persuade the club's popular, sexy lead performer and courtesan, Satine (Kidman), to work in their production.		After mistaking Christian for a rich and powerful aristocrat, The Duke (Richard Roxburgh), Satine falls in love with Christian, much to the dismay of many. However, she believes herself to be a simple prostitute, who should never fall in love because it will get in the way of success. When the Duke agrees to produce a major production at the Moulin Rogue, but only under his circumstances, things become even more complicated. The Duke demands that Satine becomes his personal property if Harold and the others want his financial support. 		Obviously, the best thing in 'Moulin Rouge!' is the music. Apart from the cast, the film's big list of musical artists includes David Bowe, Christina Aguilera, Mya, Pink, Fatboy Slim, Beck, and many others. The kind of music that plays here does not account for a period epic at all, however. 'Moulin Rouge!' doesn't try to be a historic depiction, but instead an expression of fantasy and passion. The elegant sets, eventful style, and powerful choreography scream modern day, post-pop-culture. I ran out to purchase the motion picture soundtrack. You should, too. But listening to the soundtrack on your CD player at home is nothing like experiencing the memorable singing and dancing, sexual energy, and relentless enthusiasm on the big screen.		As I say in very few film critiques, some movies are you watch, others you experience. 'Moulin Rouge' is an experience not to be missed. It is a bizarre, unique blend of exhaustive energy and lively action-one of the bravest, most ambitious and entertaining movies of the year."),		
		// add(Docs, "Undescribable, 1 July 2001		Author: honeypot from Southampton, England		This movie blew my mind. Watch it, then watch it again. 'Moulin Rouge' made me laugh, cry, and dream. It's boldness and confidence to produce something so original and different impressed me. At times the scenery was as surreal as something you would experience in a dream, which only makes this movie more amazing. 'Moulin Rouge' shows love from all angles. It includes the raw passion, infatuation, vehemence, intensity, ecstasy, jealousy, and pain that is found in true love. The acting was staggering. Ewan McGregor is unrealistically perfect, combining sweet innocence with masculinity. Kidman perfectly brings out the seductive side of Satine, yet never loses the vulnerable soul that lies behind it. Roxburgh(The Duke) and Leguizamo(Lautrec) bring out just the right amount of comic relief in this intense drama. There is nothing I would change about this movie. One warning, though: Moulin Rouge is not for the artistically deprived. It is quite a contemporary movie, so you may not like it if you prefer to watch simple movies(ex. 'American Pie', 'Scary Movie')."),		
		// add(Docs, "This is a musical for people who don't like musicals., 8 October 2001		Author: kay321 from San Francisco, CA		This was easily one of the best movies I've seen in years. Rarely do movies have a visual force capable of stunning you into rapt silence; and even more rare are films able to further this with a soundtrack that can move you and ensnare you as well, if not better, than the images. Yet some how, through genius, magic, luck, or some combination, Moulin Rouge has managed to do both. In truth Moulin Rouge is a fusion of two fabulous films into one. A film of images capable of conveying meaning without dialog or music, and a film which you could feel and understand with out needing to see it. Much effort was obviously spent on both the visual and audio aspects of this film, and by choosing not to focus on one over the other, and sacrifice the songs for the story or vice versa, the filmmakers were able to make a truly unique, modern musical which those of us who have hated musical since childhood could enjoy. Moulin Rouge is a blend of old, established techniques with innovative experimental ones, resulting in a movie which could only have been made in our time, yet which has a classic feel. The acting is wonderful, the mixture of modern songs is ingenious, and the cinematography is at times simply amazing. The end result is a stunning film with unbelievable performances; a cinematic experience that people will be loving, analyzing and trying to imitate for year."),		
		// add(Docs, "Spectacular, Spectacular!, 26 April 2002		Author: Herculeez from USA		Moulin Rouge! (2001) Rating: 9/10		Director and co-writer (with Craig Pearce) Baz Luhrmann describes the style he brought to the Australian dance flick Strictly Ballroom and his underrated take on William Shakespeare's Romeo & Juliet as 'red curtain theatricality'. He likes to deal with familiar types of stories (so the audience knows how it will end) taking place in sort of a heightened reality, with plenty of devices reminding the audience that they're watching a movie. Moulin Rouge! is a perfect example of that. It's not interested in the banal and the realistic, it's Cinema!!, with a capital 'C' and plenty of exclamation points! Music! Flying colors! Dancing! Emotions set free! Slapstick! LOVE! The red curtain opens (literally) and then we're off for one wild ride, a rocky electric cancan boogie playing over a love rollercoaster, as seen through the lenses of a filmmaker with a vision equal parts Melies, Technicolor 1950s musicals and MTV.		It's quite overwhelming at first, but in a good way. Luhrmann's frenetic back and forth camerawork puts you in the same state of mind as Christian as he enters the Moulin Rouge for the first time. On one side powdered girls are doing their thing, chanting the 'Voulez-Vous couchez avec moi?' chorus from 'Lady Marmalade', while across the way a bunch of men in tuxedos are emulating Kurt Cobain and proclaiming 'Here we are now, entertain us...', meanwhile Zidler is screaming 'Because you can can-can!' on Fatboy Slim's electronic beats... And then Satine floats down on a trapeze crooning 'Diamonds Are a Girl's Best Friends' and takes everybody's breath away... The men's, Christian's... Ours.		That's another thing; it's good to be able to craft energetic, entertaining musical numbers, but there's the danger to end up with a futile, purposeless costume revue. This never happens here because, as familiar and melodramatic as the story can be, it still involves us completely. We really feel for these passionate lovers doomed to hide their affair. When we see Satine for the first time, we fall in love with her along with Christian, and we root for him, for them, through the rest of the film. The delightfully twisted musical numbers that punctuate their tale aren't gratuitous but integral to the drama. Most every important declaration is made through song, be it Christian belting out Elton John's 'Your Song' ('How wonderful life is while you're in the world...') or Satine serenading him with 'Come What May' (one of the movie's few originals, and a great one at that), or the both of them discoursing about love with lyrics from famous songs from The Beatles, Kiss, David Bowie, Paul McCartney, Joe Cocker, Whitney Houston. Plus, not only do the songs fit in thematically, they're also reinvented in original ways. The Police's 'Roxanne' becomes a tango, Madonna's 'Like a Virgin' becomes a show tune...		Then there's the outrageous sets and costumes, the frantic choreography, the endless variety of camera angles and editing tricks... And above all, love, as communicated by Ewan McGregor and Nicole Kidman in what could be career peaks for both. Kidman is just lovable, sexy, warm and goofy, nothing like the icy bombshell she once appeared to be. McGregor is at the other end of the spectrum from diving into toilets, all charm and idealism, love obsessed writer, blue-eyed dreamer... And when put together, extraordinary chemistry erupts, they just gel together, they BELONG with one another! And they can sing too! Who knew these two had such nice voices? They're nicely surrounded by a cast of enjoyably caricatural supporting characters, from John Leguizamo's high-on-absinthe dwarf to Jim Broadbent's life of the party burly man and Richard Roxburgh' mustache-twirling Snidely Whiplash of a villain.		Moulin Rouge! is what film lovers have been waiting for... Here's a movie that makes you giddy with joy and eager to see it again and again. Spectacular Spectacular indeed!"),		
		// add(Docs, "Stunning Bag Of Wind, 23 May 2005		Author: ptmcq05 from United States		I wonder if that line from the Duke 'I don't care about your ridiculous dogma' was directed to Lars Von Triar. It could be, the film is full of knowing lines 'He could make you a star and you're dallying with the writer!' or 'They dressed me with the Argentinean's best clothes and passed me for a famous English writer' There is something of Ken Russell's second period in 'Moulin Rouge' Everything is emphasized, underlined and repeated at least three times for safety. Excess seem a rather feeble term to describe it and yet, it works. The film, for the most part, is a delight. Nicole Kidman, ravishing and spectacular, spectacular. Ewan McGregor, superb, and so charismatic that no one would blame me if I confess I had a had crush on him as soon as he broke into 'The Hills are alive with the sound of music...' Kidman and McGregor, this film proves it, are the closest thing we've had in years to the big stars of yesteryear. They could make anything shine and they have. Another detail that shouldn't go amiss, 'Moulin Rouge' opened the door again for musicals and that's always a good thing even if we're bound to be bombarded by some terrible stuff. I say it doesn't matter as long as it allows glorious film talents of the caliber of Kidman and McGregor to give us the pleasures they have even in a bag of wind such as 'Moulin Rouge'"),		
		// add(Docs, "Spectacular! Spectacular! A unique masterpiece to be seen again and again!, 29 June 2001		Author: skyler58 from Boston, MA		I have now seen Moulin Rouge more times than I should say and I have noticed something new and unique every time. This film is so intricate (and beautiful) that you cannot possibly absorb it all in one viewing. Luhrman (along with his Bazmark production team) really is a visionary and his films push the limits in such amazing ways. The music, the sets, the choreography - all of it is awe-inspiring. Ewan McGregor proves his versatility as an actor yet again by bringing such a heartfelt innocence to Christian - and the man can sing! Nicole Kidman went from being just another actress to me to one of my favorites - she takes on the role of Satine so honestly and proves that she not only has a comedic side but a great voice as well. Together the two of them light up the screen. In a year of mostly mediocre films (with a few notable exceptions) Moulin Rouge is totally refreshing. It not only promotes truth, beauty, freedom, and love but is a perfect example of them as well. Luhrman himself said that it was time for a new kind of storytelling and he was right! Open your mind and enjoy one of the most original movie experiences in years. A bohemian storm is brewing!"),		
		// add(Docs, "An inspiring rebirth of the movie musical..., 6 September 2005		Author: ironside (robertfrangie@hotmail.com) from Mexico		*** This comment may contain spoilers ***		Luhrmann's flamboyant musical 'Moulin Rouge' is a combination of Camille, La Boheme and Showgirls... The film swings easily between present and past, among so many wildly different moods: farce, tragedy, romance, satire, comedy and rock and roll...		'Moulin Rouge' is an assault on the senses, a non stop visual explosion, an exotic trip, and a love story that is sure to touch your heart... It is a gloriously cinematic spectacle with opulent imagery directed with an eye for rich color, especially the color of rouge... It is also a breathtaking and poignant piece of cinema, a disco of dreams, a crazy and daring show, a vibrant screen fantasy, a 'Bohemian Revolution,' a magical movie for those who love romance, pop music and old musical movies...		Nicole Kidman gives the film its soul... She is the 'sparkling diamond' of the show, the toast of Paris, the city's top courtesan... She melts her characterization with a sizzling, yet tender, performance... She is undeniably sexy, a beautiful singer, a flashy dancer whose heart sings whenever she sees Christian... In many ways, she is drawn as the ultimate sex goddess, as enigmatic as Greta Garbo, and her glamor masks her pain as well as her happiness... Kidman gives the film its central erotic charge, and its romantic thrills... She sways on a flying trapeze belting out Marilyn Monroe's 'Diamonds Are a Girl's Best Friend,' and Madonna's 'Material Girl.'		Ewan McGregor achieves a nice mix of optimism and desperation, emphasizing the sincerity of the love-struck poet-hero... Christian is a young idealist who moves to the bohemian section of Paris during the 'summer of love' of 1899... He is hired to write a show about 'truth, beauty, freedom and, most of all, love.' Christian battles for the body and soul of the ravishing Satine... His fundamental believe is 'the greatest thing you'll ever learn is just to love and to be loved in return...		John Leguizamo is vulnerable and sweet as Henri de Toulouse Lautrec needing a good writer to come up with story and lyrics for his new show called 'Spectacular Spectacular.'		Jim Broadbent is wonderfully comic as the ringmaster Harold Zidler... He is a jovial impresario who peddles the charms of a successful Satine to a mesmerized public... He is the owner of the infamous nightclub who has promised Satine to the evil Duke of Monroth... He has his eye on her too... 		Richard Roxburgh is odious as the jealous benefactor obsessed with Satine to the point of murder... He is stunningly arrogant wanting the gorgeous can-can chanteuse in an 'exclusive contract.'		Luhrmann combines 1900 Can Can burlesque with modern musical poetry, exploiting Kidman's grace and beauty and overwhelming the audience with frenetic dance numbers delivered in operatic-style... Like Orson Welles, Luhrmann loves the technical magic of movies... When a red curtain opens, an orchestra conductor emerges to direct the unmistakable '20th Century Fox' theme opening, we immediately realize we're in for something really magical: A spectacular costume revue, an eye-catching fin de siecle exuberance, an inspiring rebirth of the movie musical..."),
		return Docs
	},

	// ==============================================================
	// UI State
	// ==============================================================
	
	RawPrefixInput = state(Unit String, ""),
	EnteredInput = state(Unit String, ""),
	FreshInputValue = state(Unit String, ""),
	SelectedIndex = state(Unit Number),
	KeyCode = state(Unit Number),
	
	// ==============================================================
	// Build Indices
	// ==============================================================
	
	ParseWords = function (s::String)::Set String {
		var input = s.replace(/[^A-Z^a-z^ ]*/g, "");
		input = input.toLowerCase();
		var words = input.split(" ");
		return arrayToSet(words);
	},
	
	ProcessWord = function (s::String)::String {
		var input = s.replace(/[^A-Z^a-z^ ]*/g, "");
		return input.toLowerCase();
	},
	
	ForwardIndex = buildMap ParseWords Docs,
	
	InvertedIndex = invert ForwardIndex,
	
	Terms = keys InvertedIndex,
	
	
	// ==============================================================
	// Search
	// ==============================================================
	
	nextWord = function (word::String)::String {
		if (word !== "") {
			return word + "z";
		} else return word;
	},
	
	PrefixInput = mapUnit ProcessWord RawPrefixInput,
	// PrefixMatches = flattenUnitSet (bindUnit (swap getKey InvertedPrefixes) PrefixInput)::Set String,
	PrefixMatches = rangeByKey PrefixInput (mapUnit nextWord PrefixInput) Terms::Set String,
	
	
	SearchInput = mapUnit ProcessWord EnteredInput,
	SearchResults = bindUnit (swap getKey InvertedIndex) SearchInput,
	
	// GetLengths = S -> oneTo (StringLength S) :: String -> Set Number,
	// GetPrefixes = S -> mapSet (SubString S) (GetLengths S) :: String -> Set String,
	// Prefixes = buildMap GetPrefixes Terms ::Map String (Set String),
	// InvertedPrefixes = invert Prefixes,
	
	
	// ==============================================================
	// Draw functions
	// ==============================================================

	DrawIndex = template (Index::Map String (Set String)) {
		<f:each Index as Key, Value>
			<div style="position:relative; left:5">
				<b>{Key}</b>
				<f:each Value as Value>
					<div style="position:relative; left:10">
						{Value}
					</div>
				</f:each>
			</div>
		</f:each>
	},
	
	DrawSearchResults = template (Results::Set String, Input::String) {
		<f:each Results as Result>
			<div style="padding-top:10; left:5">
				{Result}
			</div>
		</f:each>
	},
	
	DrawPrefixMatches = template (Matches::Set String) {
		// <f:each Matches as Match>
		// 	<div>
		// 		{Match}
		// 	</div>
		// </f:each>
		<f:each Matches as Match>
			MyPosition = getPosition Match Matches,
			MyUnitBool = (mapUnit2 equal (MyPosition) SelectedIndex)::Unit Bool,
		
			if bindUnit boolToUnit MyUnitBool as _ {
				<div style="position:relative; padding-top:10; padding-left:5; background-color:teal">
					{Match}
				</div>
			} else {
				<div style="position:relative; padding-top:10; padding-left:5">
					{Match}
				</div>
			}
		</f:each>
	},


	
	<div style="position:absolute" style-height="400px">
		// <div style="position:absolute; top: 0; left:0; width:600">
		// 	<div style="font-size:18; color:teal">Source</div>
		// 	<f:call>DrawSet (keys ForwardIndex)</f:call>
		// </div>
		// <div style="position:absolute; top: 0; left:200; width:200">
		// 	<div style="font-size:18; color:teal">Inverted Index</div>
		// 	<f:call>DrawIndex InvertedIndex</f:call>
		// </div>
		// <div style="position:absolute; top: 0; left:400; width:200">
		// 	<div style="font-size:18; color:teal">Terms</div>
		// 	<f:call>DrawSet Terms</f:call>
		// </div>
		// <div style="position:absolute; top: 0; left:600; width:200">
		// 	<div style="font-size:18; color:teal">Inverted Prefixes</div>
		// 	<f:call>DrawIndex InvertedPrefixes</f:call>
		// </div>
		<div style="position:absolute; top: 0; left:0; width:600">
			<div style="font-size:18; color:teal">Search</div>
			// Prefix Input: {PrefixInput}
			// <br />
			// SelectedIndex: {SelectedIndex}
			// <br />
			// KeyCode: {KeyCode}
			// <br />
			// SelectedIndex: {SelectedIndex}
			// <br />
			<input type="text" value="{FreshInputValue}">
				<f:on blur>
					set RawPrefixInput ""
				</f:on>
				<f:on keyup>
					extract boolToUnit (or (or (equal event.keyCode 8) (equal event.keyCode 46)) (and (greaterThan event.keyCode 64) (lessThan event.keyCode 123))) as _ {
						set RawPrefixInput event.value,
						unset SelectedIndex
					}
				</f:on>
				<f:on keydown>
					extract boolToUnit (equal event.keyCode 40) as _ {
						if SelectedIndex as currentIndex {
							set SelectedIndex (plus currentIndex 1)
						} else {
							set SelectedIndex 0
						}
					},
					extract boolToUnit (equal event.keyCode 38) as _ {
						prevTerm = fetch SelectedIndex,
						set SelectedIndex (subtract prevTerm 1)
					},
					extract boolToUnit (equal event.keyCode 13) as _ {
						extract SelectedIndex as SelectedIndex{
							SelectedTerm = fetch (getByPosition SelectedIndex PrefixMatches),
							set EnteredInput SelectedTerm,
							set FreshInputValue SelectedTerm
						},
						extract reactiveNot SelectedIndex as _{
							set EnteredInput event.value
						},
						set RawPrefixInput "",
						unset SelectedIndex
					}
				</f:on>
			</input>
			<div style="position:relative; top: 0; width:155; background-color:rgb(68, 170, 255); z-index:2">
				<f:call>
					if reactiveNot (bindUnit (a -> boolToUnit (equal "" a)) RawPrefixInput) as _ {
						DrawPrefixMatches PrefixMatches
					} else {
						<div />
					}
				</f:call>
			</div>
			<div style="position:absolute; top: 90; width:600">
				<div style="font-size:18; color:teal">Results</div>
				<f:each SearchResults as SearchResults><f:each EnteredInput as EnteredInput>
					<f:call>DrawSearchResults SearchResults EnteredInput</f:call>
				</f:each></f:each>
			</div>	
		</div>
	</div>
}