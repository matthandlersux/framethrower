action () {
  setEssayText = action (text::String) {
    set (Situation:propText mrEssay) text
  },

  makeTextPoint = action (char::Number) {
    createTextPoint mrEssay pipeTextlineToMrEssay char
  },
  makeTextRange = action (start::Number, end::Number) {
    tp1 <- makeTextPoint start,
    tp2 <- makeTextPoint end,
    createInterval mrEssay (cons lineToTextline pipeTextlineToMrEssay) tp1 tp2
  },

  makeVideoPoint = action (time::Number) {
    createTimePoint mrEssayTimeline pipeTimelineToMrEssayTimeline time
  },
  makeVideoRange = action (start::Number, end::Number) {
    tp1 <- makeVideoPoint start,
    tp2 <- makeVideoPoint end,
    createInterval mrEssayTimeline (cons lineToTimeline pipeTimelineToMrEssayTimeline) tp1 tp2
  },

  makeLink = action (from::Situation, to::Situation) {
    makeInfon2 ulink ulinkSource ulinkTarget mrEssay from to
  },






setEssayText "This is written as a first post to FilmsFolding. A goal of that project is to build a community and infrastructure of film annotators, the idea being based on three notions:

* There is an emerging type of engagement that we can have with a film, beyond watching, and perhaps writing about it. This engagement might be in a new zone  between that which engages with the film on its own terms (usually called \"watching\") and engaging on our terms (often called \"commentary\" or \"criticism\").

* New tools might be created that enable this way of relating to films. These really would have to be new tools, based on \"disruptive,\" technologies; what we currently have and what is expected to emerge will not do, so we will have to invent them ourselves.

* Films have already been growing into this space, many of them exhibiting added structure that engages the viewer in a layer above the story. I've called the collection of techniques that do this \"folding.\" These are self-aware devices that add new layers to the narrative dynamics. An intelligent way to think about how we would build tools to grow this emerging \"engagement space\" is to understand the already existing, natural tendency in movies, and then build on it.

Toward the goal of discovering the \"existing tendency in movies\" for folding, I propose a discussion about \"Moulin Rouge.\"

A disclaimer first: \"folding\" is not a very ambitious notion. I do not propose it as a new basis for film criticism, and surely not as a primary means for appreciating films. I think it is an interesting, new element of films that is evolving quickly and probably is changing or reflecting similar developments in the way we imagine. It is particularly interesting to someone who wants to understand how we model ourselves, and it would be useful to someone designing a next generation collaborative film annotation tool. But it is only one component in a full theory of narrative dynamics.

Three Provocative Questions about \"Moulin Rouge:\"

* What is the role and significance of the typewriter?

* Is there a question about whether the story is an absinthe hallucination?

* Did Satine kill herself, and was it part of a struggle for \"authorship\"?


A simple type of folding involves stories where a character in the story is also the creator or teller of the story. In such a case, you get two layers: the story and the story of the telling of the story. \"Moulin Rouge\" takes this to an entertaining extreme in density, combined with two other common devices. One of these devices comes with the narrative folding as it is done in \"Moulin Rouge;\" an overlapping of the time of the story with the time of the telling (and here, the typing of the thing). The other common device is love-as-performance, especially in the context of sex.

Baz Luhrmann said of this project: \"So we thought, let's look back to a cinematic language where the audience participated in the form. Where they were aware at all times that they were watching a movie, and that they should be active in their experience and not passive. Not being put into a sort of sleep state and made to believe through a set of constructs that they are watching a real-life story through a keyhole. They are aware at all times that they are watching a movie. That was the first step in this theatricalized cinematic form that we now call the Red Curtain.\"

This little essay sketches out two things. First there is the matter of the narrative nesting or layering, which is the primary structural device in the film and which is used to always let you know that you are watching a movie. Then there is the more interesting and complex idea of causal intercession that the layering allows. Together, you might call this folding. Here,  \"nest\"  \"wrapper\" and \"layer\" are used interchangably with \"fold.\"



A common device in narrative is for a story to be \"framed\" by a storyteller. \"The Princess Bride\" is a movie which has little bits at the beginning, middle and end which show a man telling a bedtime story to his grandson. A reason to do this for \"The Princess Bride\" is simple: it provides an easy way for the filmmaker to quickly establish a certain level of fantasy and humor on which that movie depends.

\"Moulin Rouge\" does this same sort of nesting many times, jumping around and blurring the layers; as intended, we get more engaged in the way the story is being told than in the story itself.

(A warning here, building on the earlier disclaimer. Real, powerful art -- the kind we can get passionate about and which changes our lives -- has a narrative power that this movie does not have. Films like that, when considered in terms of their narrative dynamics, have deeper, softer goals than \"Moulin Rouge\" and deserve a fuller vocabulary for discussion than \"folding\" alone. With a collaborator, I am developing these modeling tools, and hope to present some of them soon. In that context, you can think of the folded nesting I describe here as simple architectural \"surfaces\" in a metaphoric space with all sorts of connected elements, forces and movement.

I picked \"Moulin Rouge\" because it was fabricated for just the simple thing we need to highlight here.)



The story is based on the date movie formula which follows the pattern of: couple falls in love, usually by accident; there are external difficulties and they break up. Usually the breakup is due to a misunderstanding. At the end, the two come together again with a public pronouncement of their love, often witnessed by an on-screen audience that is designed to reflect us as audience.

On that formulaic backbone, \"Moulin Rouge\" adds simple elements from: a sacrifice story; another of obsession (for beauty) by a powerful man; love (or at least sex) as a performance; and yearning to \"fly away.\" All of these are combined in interesting but obvious ways, for instance Satine (the heroine) is a \"courtesan\" who performs well as a sex object, and who is willing to do one more trick (with an obsessed rich duke) to get funding to prove she is a \"real\" actress and thus escape. The actual plot is drawn from \"La Boheme\" (which Luhrmann staged) and \"La Traviata,\" as well as the works of Toulouse-Lautrec and a previous film by the name of \"Moulin Rouge.\"

So you have these external patterns that by themselves probably shouldn't be counted as folds unless there are self-aware internal references that use them. There are some of these in \"Moulin Rouge,\" like the sign outside Christian's apartment, which is from Luhmann's stage production of \"La Boheme.\" But I'll skip over those.



The first and most \"outer\" nesting is the initial red curtain . (\"Outer\" is a matter of timing and not significance. This enclosure is outer because it begins first and ends last and thus encloses what it contains.)

This is the third film in which Baz has used this red curtain device. It is unusual in that it even wraps the 20th Century logo and has its own entertainment value in a comically animated conductor. This wrapper closes the film with a closing curtain  but you will see this red curtain at other key turning points in the nests: when we are first introduced to the Moulin Rouge ; in Satine's brothel bed in the elephant, where she \"performs ;\" when, in that same room, the players first act out the play ; and when at the end, the play itself is performed .

This curtain wrapper is asymmetric. At the beginning, the curtains open to reveal a faded old movie with the titles. But at the end, the curtains close on a closeup of the typed page of the story Christian has just finished. After it closes, you then have the credits presented in the same faded placards that were inside the curtain before.

The second nest, or wrapper is our  \"outer\" narrator. He appears  after a similar placard tells us that this is Paris, 1900. This time the placard is in reverse, white letters on black: same font, style and border. This outer narrator is another persona of Toulouse-Lautrec, as we will see. He is wearing part of the costume he wears at the end, as the singing \"magical sitar\" who sings a song of love, an elaborate cross-fold role written into the play at several levels of the nesting. He indeed sings the song of love, introducing the hero. Notably Christian is introduced as strange and \"enchanted,\" the enchantment in part being (we discover) pharmaceutical.

This nest ends  just before the curtain layer, with a reappearance of this singer, again outside in front of the windmill. This time, he retains the facial makeup of the magical sitar character, which he -- in the inner play in the movie -- has just been prominent, playing a role much like he does in this outer nest: as the physically high observer of the love tragedy. Again at the end we are reminded that Christian is enchanted and by then we know why: through absinthe.

This already is where the nests get entangled. The primary story is about Christian writing the story at his typewriter. The end of this typing happens  after the outer narrator has begun closing the film, so a layer that begin as inside the song of the sitar ends as outside. This is how it must be, because the sitar himself is a character written on that typewriter. (Or is he? We'll see that it might be the other way around.)

The outer narrator appears in the story in four guises, beginning as the outer narrator proper, here at the beginning and at the end. He is Toulouse-Lautrec in the story involving the young Christian. He is also the \"magic singing sitar\" in the play, as we have noted. And he is the embodied absinthe which factors later on. As Lautrec, he first appears as a dwarf (which he is) dressed as a nun, giving us a clue of sorts that he will take several roles.

This outer narrator appears briefly at the end of the first act , together with the older Christian, writing.

The next nesting -- going by the order we see them in the film -- is the writing of the movie we are seeing. This is the beginning of the layer that we noted ended after the layer that starts enclosing it. Here we see Christian in 1900, several months after Satine has died. He has a beard which helps us keep the times straight. He is beginning the writing/typing of what we will see in the nests that are enclosed ever inward.

You can already see that we have many, many layers, each nominally contained within another, but they touch each other and affect each other in possibly complex ways, which we will get to later. For now we are just doing some high level mapping of the layers.

The latter Christian appears throughout the film, first reporting that he was given the task of writing the inner play  and periodically throughout to remind us that he is there.

Next, we have the first cinematic nesting technique: the physical zooming in and out of the camera . This happens so many times through the two hours, it is not worth detailing except when it signifies something unusual. A notable instance is midway in the movie  when the layer shifts from what is happening (we learn that Satine is dying); to the writing of what is happening, in the play. This is denoted by a quick zoom out of a grey Paris and a zoom into a colorful Paris, just exactly as the same effect -- but the opposite meaning -- when first used. There it denotes the shift between the story being told by the older Christian (as the inner narrator, compared to the Lautrec character) and the story itself that shows the younger Christian.

All of this nested layering occurs within the first four minutes of the movie. But there is more...

Our young \"boy,\" Christian, appears -- on a \"magic day\" -- at the beginning of the story the older Christian is writing. The young Christian arrives with a typewriter, which will become a key agent we'll discuss later. Along the way, his father warns him about, and few seconds later  he encounters the Absinthe Bar. Absinthe is a key agent in what happens later.

He sits down to write and the typewriter writes by itself (controlled from the future as we will see). It types \"an unconscious Argentinian fell through my roof,\" followed by just that happening.

This leads to events that result in him being asked to write the script for a play, nominally based on \"The Sound of Music\" (which we have already heard at the red curtain) and to be called \"Spectacular Spectacular.\" The word \"spectacular\" is used in both of its senses here. There is the obvious one meaning \"thrilling;\" but there is the other meaning as well, associated with observation. So the words denote a self-observed entertainment as well as an entertaining look at self-observation.

And THIS, leads to the next fold. These nestings get more significant and there are really only two more of this type to go. The one coming up is Christian's first drink of absinthe after we hear the music from \"Sound of Music\" being played on glasses filled with absinthe . That absinthe music is stopped because \"it's drowning out my words.\" Later, there really is some sort of battle going on between the absinthe and the written words (on the typewriter), but we'll get to that soon.

For now, lets just note that we enter another nest, another layer. What happens after this drink, everything, can be seen as a hallucination brought on by the absinthe. It starts with the green fairy (Kylie Minogue)  but she turns into a demon  and we are spun into space with what happens next. That being spun into space is an effect that goes by quickly, and zooms us into the sex club with Christian disguised as an English poet.

A minor nest can be noted if you are reading and watching the film. Christian is a visitor to the club but gets swept up in the performance and his ability to do so is admired (\"good to take interest in our show\"). There is a concurrent case of mistaken identity.

And there is the final nesting, the play within, which goes slowly and with many complicated, intricate notions. The first is when, in the elephant, the crew has to make up the play on the spot .

Following this as entertaining middle, we have the genre of the stage musical mixed in for a bit, where the story and the musical play traditionally get merged in the genre. There are several episodes of these, where we also get the few essential plot points. Interspersed are successively maturing versions of the play within, always with issues about the uncertain end and the role of the magical sitar (Lautrec), his player (the Argentine, standing in for Christian) and how they affect the love (Satine).

The most remarkable musical episode in this middle part is when the sexual tension peaks, and there seems to be sexual coupling everywhere you look, or the desire for it. This is woven together by a tango, expertly intercut with ALL the layers .

We have the final, final nest when the actual play begins . During this play, we have a mirror of the original number with Satine, both with the song and the camera.

So far as the date movie story is concerned, the public confession of love occurs and the two are reconciled. This part, we are constantly told -- the Love part -- is true. All else might not be, having been made up.

We zoom out and up, encountering out outer narrator (who is already high above the stage) and the older Christian finishing the story we have just seen, typing \"the end\" as the end occurs.

To summarize: we have the real world of us; the world of the red curtain; the world of the first, outer narrator;  and the world of the older Christian who tells the story. This last is nominally the real world of the action of the movie.

Within that we have the world of the young Christian; the hallucinatory world of the absinthe vision; and then the world of several performances: those at the club, those in the play as it matures, those of the prostitute, and those of the ordinary stage musical, which gives an excuse to merge the four.


Setting up all these layers is fun. What makes us call them \"folds\" is when they touch and affect each other resulting in causal intercession from one layer or fold to the next.

The big picture here is that the typed story about the lovers includes a typed script for a play. Each affects the other, with the unusual effect that Christian controls everything that happens with that typewriter. He controls it before it happens as he is in the movie and is writing the play that determines everything. He also controls it through the typewriter after the fact, by recording what happened, potentially all made up.

The chief agent in this is the typewriter which we first see as the young Christian, who comes to town from the sticks . We know this is 1899. We see the typewriter in the first couple minutes of real action, coming brand new from its wooden case, slyly introduced after a \"key\" is presented to the boy. The typewriter is an Underwood No. 5. This is a famed machine, one of the favorite machines for writers until the advent of the electric typewriter and then the personal computer.

For instance, it factors heavily in the William Burroughs \"Naked Lunch\" where typewriters literally do the writing, coming alive and battling each other. Indeed, Kerouac finished \"Naked Lunch\" for his friend on his Underwood No. 5. There's a remarkable history of this machine which factors into the story. The machine first appeared in 1900, just barely in time for the older Christian to write the story about Satine's death.

But the younger Christian would not have had it when he arrived in 1899, when it is shown. I believe that this is not a goof, nor do I suppose it was intended as an obvious clue to be discovered during the watching. I think it was simply careful writing on the part of Baz, who would have believed that everything we see until the end may well have been created retrospectively at the end or as a hallucination, explaining the anachronistic typewriter at the beginning.

This may seem a reach, so let's back up a bit. We know that Christian writes a play, and that forces are at work to determine how it ends, starting with the Duke's early question . The young Christian wants the girl and is writing that in. The Duke wants the girl too and through an agent we will get to in a minute, is writing in that contradictory ending. We see that Satine also is determined to write the ending with her death, and we see her take something which could be medicine, but is likely poison . We also know that the typewriter is in two worlds, writing both before and after the fact.

Lets go to the second agent: the absinthe.

From the beginning, the absinthe could be doing the writing. We have Lautrec guiding the writing of the play, starting in the elephant. He suggests and becomes the magical sitar, whose song determines the end of the thing. As time goes on, he becomes less and less Lautrec and more the sitar. He has a metamorphosis from the writer, to the magical sitar, and then to the outer narrator. All this is through the agency of the absinthe.

We are reminded of this by the absinthe poster  at the \"stage,\" above Christian's apartment as the play comes together.

At the beginning of the crisis over Satine having her necessary sex with the duke, there is a flash of a scene  where Christian faces Lautrec holding the absinthe. Christian subsequently loses faith in the end and collapses, the screen goes grey and we see what is behind this; the absinthe user has crashed, literally passing out, to be rescued by friends . Following this, Lautrec in his absinthe role counsels Christian to keep a cool head . But instead, he pawns his typewriter (but in this shot it looks like it is NOT the Underwood No 5 but the Underwood model appropriate for 1899). So at least at this point in the story, the typewriter loses agency.

 During the final play, we see Lautrec in green light  in his role as the absinthe muse. The story is in suspense because he \"can't remember his line,\" right after Satine tries to control the story, perhaps by taking her poison. He is holding  the absinthe bottle from earlier .

But he decides what the story should be (at this moment in all four personas denoted by a complex lighting), and the coincidences and resolutions begin.

Then sitar/absynthe sings the love song and the two bond.

So here are the reasons to ask our three questions:

The Typewriter Controls The Story:

This one is somewhat convincing. We have the probable anachronism of the typewriter that only exists in the world of the older Christian. We have the fact that when the young Christian sits down to write, the typewriter writes automatically, specifying events as they happen. We are reminded of this throughout the whole movie by seeing the typing (as each Christian at work and as the words appearing on the page) as events unfold, all the way until the very end, when \"the end\" is typed. Just at the point when it seems that the typewritten sense of the story, and Christian's desired version is failing, we see the typewriter pawned or sold for no apparent reason. Then to save the situation, a key character \"remembers\" his line.

Everything After That First Drink Is An Absinthe Vision:

We've reviewed this possibly in detail above. It is pretty clear that Baz wants us to entertain this possibility. In fact, this notion is common in other absinthe movies. There is just too much absinthe present in too many places for Baz not to have made it significant.

Satine Poisons Herself:

You are not likely to buy this if you have trouble with the other two.

The source operas clearly have Satine as tubercular and dying. But there are indications that she is a drug addict, supplied by the older woman. She is injected with an opiate by her so that she can rouse and meet the Duke. At the end, you clearly see Satine take some pills, while that same woman eggs her on. They are probably medicine if you watch simply, but Satine does die shortly thereafter.

Consider the structure. Kubrick famously structured \"2001\" as three forces (man, machine, cosmos) struggling for control over the story, the very storytelling. This is commonly discussed and sometimes followed in films that parade overt structure. This film tells you many, many times that it is about three things: truth, beauty and freedom, but the only thing to believe in is love.

\"Truth\" here is represented by Christian, the narrator. It is a compact we make with the film that we accept what is told. \"Beauty\" of course is Satine. \"Freedom\" is the Absinthe. Each of these fight for control of the story and in particular how the story ends. The Duke holds the place in the source operas as the spoiler, even the devil. Indeed, there is one indication of this when his eyes flash when he encounters the story the first time  , when told by Christian.

If each of these is trying to write the end: Christian by writing, Absinthe through the Duke by asserting control over the very existence of thing, then Satine is as well. She knows her plight. She knows she will die anyway. She knows (when she takes the poison) that she has lost her true love. Remember that Baz's last film had Juliet in exactly the same situation, poisoning herself thinking her love was lost.

But in the end, truth, beauty and freedom have not controlled what matters. Only love has. In other words, we the audience have controlled the ending. Elsewhere, I'll put together some tentative thoughts about how noir might be driving this.

The basic idea is that the audience plays an active role in the story, as \"gods\" manipulating events and circumstances for our entertainment, framing the world according to the constraints of the medium. Among these constraints are the restrictions of \"genre.\" For now, let's just say that the date movie genre determines that the movie ends with an affirmation of love, despite all else. So it does.",
v0 <- makeVideoPoint 15,
v1 <- makeTextPoint 6642,
makeLink v1 v0,
v2 <- makeVideoPoint 7182,
v3 <- makeTextPoint 7048,
makeLink v3 v2,
v4 <- makeVideoPoint 660,
v5 <- makeTextPoint 7174,
makeLink v5 v4,
v6 <- makeVideoPoint 1574,
v7 <- makeTextPoint 7237,
makeLink v7 v6,
v8 <- makeVideoPoint 2479,
v9 <- makeTextPoint 7300,
makeLink v9 v8,
v10 <- makeVideoPoint 5845,
v11 <- makeTextPoint 7352,
makeLink v11 v10,
v12 <- makeVideoPoint 102,
v13 <- makeTextPoint 7763,
makeLink v13 v12,
v14 <- makeVideoPoint 7061,
v15 <- makeTextPoint 8378,
makeLink v15 v14,
v16 <- makeVideoPoint 7113,
v17 <- makeTextPoint 8993,
makeLink v17 v16,
v18 <- makeVideoPoint 3173,
v19 <- makeTextPoint 9794,
makeLink v19 v18,
v20 <- makeVideoPoint 504,
v21 <- makeTextPoint 10652,
makeLink v21 v20,
v22 <- makeVideoPoint 536,
v23 <- makeTextPoint 10652,
makeLink v23 v22,
v24 <- makeVideoPoint 593,
v25 <- makeTextPoint 10652,
makeLink v25 v24,
v26 <- makeVideoPoint 222,
v27 <- makeTextPoint 10812,
makeLink v27 v26,
v28 <- makeVideoPoint 3919,
v29 <- makeTextPoint 10976,
makeLink v29 v28,
v30 <- makeVideoPoint 330,
v31 <- makeTextPoint 11850,
makeLink v31 v30,
v32 <- makeVideoPoint 418,
v33 <- makeTextPoint 12896,
makeLink v33 v32,
v34 <- makeVideoPoint 599,
v35 <- makeTextPoint 13329,
makeLink v35 v34,
v36 <- makeVideoPoint 656,
v37 <- makeTextPoint 13357,
makeLink v37 v36,
v38 <- makeVideoRange 2156 2570,
v39 <- makeTextPoint 14008,
makeLink v39 v38,
v40 <- makeVideoRange 4556 5046,
v41 <- makeTextPoint 14766,
makeLink v41 v40,
v42 <- makeVideoPoint 5845,
v43 <- makeTextPoint 14827,
makeLink v43 v42,
v44 <- makeVideoPoint 341,
v45 <- makeTextPoint 16626,
makeLink v45 v44,
v46 <- makeVideoPoint 2465,
v47 <- makeTextPoint 18073,
makeLink v47 v46,
v48 <- makeVideoPoint 6102,
v49 <- makeTextPoint 18402,
makeLink v49 v48,
v50 <- makeVideoPoint 2583,
v51 <- makeTextPoint 19026,
makeLink v51 v50,
v52 <- makeVideoPoint 4846,
v53 <- makeTextPoint 19211,
makeLink v53 v52,
v54 <- makeVideoRange 5693 5763,
v55 <- makeTextPoint 19457,
makeLink v55 v54,
v56 <- makeVideoPoint 5816,
v57 <- makeTextPoint 19543,
makeLink v57 v56,
v58 <- makeVideoPoint 6100,
v59 <- makeTextPoint 19814,
makeLink v59 v58,
v60 <- makeVideoPoint 6124,
v61 <- makeTextPoint 20003,
makeLink v61 v60,
v62 <- makeVideoPoint 601,
v63 <- makeTextPoint 20037,
makeLink v63 v62,
v64 <- makeVideoPoint 2035,
v65 <- makeTextPoint 22736,
makeLink v65 v64















}