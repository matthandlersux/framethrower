function infonTest(s, G){
	var relation = s.makeRelation();
	var role = s.makeRole();

	var individual = s.makeIndividual();

	var arc = {arg:individual,role:role};
	var arcs = [arc];
	
	var infon = relation.makeInfon('testid',arcs);
	console.dir(infon);
}






//function to run tests, takes the root situation s as input and an object G available in the debug context (to share objects)
function randomCorrespondence(s, G){
	var s1 = s.makeSituation();
	var s2 = s.makeSituation();
	var s11 = s1.makeSituation();
	var s12 = s1.makeSituation();
	//var s21 = s2.makeSituation();
	//var s22 = s2.makeSituation();
	
	
	var ind = [];
	ind[0] = s.makeIndividual();
	ind[1] = s1.makeIndividual();
	ind[2] = s2.makeIndividual();
 	ind[3] = s11.makeIndividual();
 	ind[4] = s12.makeIndividual();
 	//ind[5] = s21.makeIndividual();
	//ind[6] = s22.makeIndividual();
	
	for(var i = 0; i<ind.length;i++){
		ind[i].setContent('ind' + i);
	}
	
	var pairs = [];
	

	for(var i = 0; i<ind.length;i++){
		for(var j = i+1; j<ind.length;j++){
			//makeCorrespondence(ind[i],ind[j]);
			pairs.push({1:i,2:j});
			//alert('done: ' + i + ", " + j);
		}		
	}


	//randomly sort the pairs
	
	var randomNum = function(a,b){
		return Math.random()*2-1;
	}
	
	pairs.sort(randomNum);

	//for(var i=0;i<pairs.length;i++){
	for(var i=0;i<3;i++){	
		makeCorrespondence(ind[pairs[i][1]],ind[pairs[i][2]]);
	}


	
}