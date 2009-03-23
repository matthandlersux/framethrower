// create a little test world
var rw = actions.makeSituation();
rw.control.content.set("Real World");


	var s1 = actions.makeSituation(rw);
	s1.control.content.set('s1');
	var s2 = actions.makeSituation(rw);
	s2.control.content.set('s2');
	var s11 = actions.makeSituation(s1);
	s11.control.content.set('s11');
	var s12 = actions.makeSituation(s1);
	s12.control.content.set('s12');
	//var s21 = s2.makeSituation();
	//var s22 = s2.makeSituation();
	
	
	var ind = [];
	ind[0] = actions.makeIndividual(rw);
	ind[1] = actions.makeIndividual(s1);
	ind[2] = actions.makeIndividual(s2);
 	ind[3] = actions.makeIndividual(s11);
 	ind[4] = actions.makeIndividual(s12);
 	//ind[5] = s21.makeIndividual();
	//ind[6] = s22.makeIndividual();
	
	for(var i = 0; i<ind.length;i++){
		ind[i].control.content.set('ind' + i);
	}
	
	var pairs = [];
	

	for(var i = 0; i<ind.length;i++){
		for(var j = i+1; j<ind.length;j++){
			pairs.push({1:i,2:j});
		}		
	}


	//randomly sort the pairs
	
	var randomNum = function(a,b){
		return Math.random()*2-1;
	};
	
	pairs.sort(randomNum);

	//for(var i=0;i<pairs.length;i++){
	for(var i=0;i<3;i++){	
//		makeCorrespondence(ind[pairs[i][1]],ind[pairs[i][2]]);
	}



// this is all we need to get started
var mainAmbient = makeAmbient();
processAllThunks(mainAmbient, document.getElementById("html_mainscreen"), {rw: rw}, "");

//load a transaction thunk xml
var transPerforms = loadXMLNow(ROOTDIR + 'testing/xml/toplevelperforms.xml');


processAllPerforms(mainAmbient, transPerforms, {rw:rw, ind0:ind[0], ind1:ind[1], ind2:ind[2], ind3:ind[3], ind4:ind[4]}, {}, "testing/xml/toplevelperforms.xml");




/*


// add some more stuff to the test world (to test reactivity)

var inftest = actions.makeInfon(rw, performs, {performer: sc, performee: jb});

var rose = actions.makeIndividual(tmov);
rose.control.content.set(parseXML("<html:i>Rose</html:i>"));

*/

// testing svn