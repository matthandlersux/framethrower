//function to run tests, takes the root situation s as input and an object G available in the debug context (to share objects)
function test(s, G){
	var GF = s.makeSituation();	
	GF.setContent({name:'Goldfinger', type:'movie'});
	
	s.setContent({name:'world'});
	
	var SC = s.makeIndividual();
	SC.setContent({name:'Sean Connery',type:'person'});

	var JB = GF.makeIndividual();
	JB.setContent({name:'James Bond',type:'person'});

	//JB.setCorrespondsOut(SC);
	//SC.setCorrespondsIn(JB);
	makeCorrespondence(SC,JB);
	
	
	var GE = s.makeSituation();
	GE.setContent('GoldenEye');
	var JBinGE = GE.makeIndividual();
	JBinGE.setContent('James Bond in Goldeneye');
	makeCorrespondence(JB,JBinGE);
	var innerMovie = GE.makeSituation();
	var innerJB = innerMovie.makeIndividual();
	makeCorrespondence(JB,innerJB);
	
	G.GF = GF;
	G.SC = SC;
	G.JB = JB;
	G.GE = GE;
	G.JBinGE = JBinGE;
	G.innerMovie = innerMovie;
	G.innerJB = innerJB;
}