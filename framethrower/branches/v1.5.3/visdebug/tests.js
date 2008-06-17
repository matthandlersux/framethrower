//function to run tests, takes the root situation s as input and an object G available in the debug context (to share objects)
function test(s, G){
	var s1 = s.makeSituation();
	var s2 = s.makeSituation();
	var s11 = s1.makeSituation();
	var s12 = s1.makeSituation();
	var s21 = s2.makeSituation();
	var s22 = s2.makeSituation();
	
	
	var ind = [];
	ind[0] = s.makeIndividual();
	ind[1] = s1.makeIndividual();
	ind[2] = s2.makeIndividual();
 	ind[3] = s11.makeIndividual();
 	ind[4] = s12.makeIndividual();
 	ind[5] = s21.makeIndividual();
	ind[6] = s22.makeIndividual();
	
	for(var i = 0; i<ind.length;i++){
		ind[i].setContent('ind' + i);
	}
	
	
	makeCorrespondence(ind[0],ind[1]);
	makeCorrespondence(ind[0],ind[2]);
	makeCorrespondence(ind[3],ind[0]);
	
/*
	for(var i = 0; i<ind.length;i++){
		for(var j = i+1; j<ind.length;j++){
			makeCorrespondence(ind[i],ind[j]);
			alert('done: ' + i + ", " + j);
		}		
	}
*/	

	
}