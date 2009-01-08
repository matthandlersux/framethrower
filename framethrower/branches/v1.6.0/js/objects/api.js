function makeAPI () {
	
	function makeInfon (relationWithInvolvesR, argsWithInvolvesL, index) {
		var argWithInvolvesL = argsWithInvolvesL[index];
		if (index == argWithInvolvesL.length) {
			return relationWithInvolvesR.relation;
		}

		var involvesL = makeControlledCell("Set K.cons");
		var involvesR = makeControlledCell("Set K.cons");
		
		var arg = argWithInvolvesL.arg;
		var relation = relationWithInvolvesR.relation;
		var infon = makeObject("K.cons", {involvesL:involvesL, involvesR:involvesR, relation:relation, arg:arg});
		argWithInvolvesL.InvolvesL.add(infon);
		relationWithInvolvesR.InvolvesR.add(infon);

		var newRelationWithInvolvesR = {relation:infon, involvesR:involvesR};

		return makeInfon(newRelationWithInvolvesR, argsWithInvolvesL, index+1);		
	}
	
	//public
	return {
		makeObject: makeObject,
		makeInfon: makeInfon,
		modifyUnitProp: function (object, propName, newValue) {
			return null;
		}
	};
}


var api = makeAPI();