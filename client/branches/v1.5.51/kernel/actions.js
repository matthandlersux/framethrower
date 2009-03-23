var actions = (function () {
	
	function makeObject(type, parentSituation) {
		var o = type.make();
		if (parentSituation) {
			o.control.parentSituation.set(parentSituation);
			parentSituation.control.childObjects.add(o);
		}
		return o;
	}
	
	return {
		makeSituation: function (parentSituation) {
			return makeObject(kernel.situation, parentSituation);
		},
		makeIndividual: function (parentSituation) {
			return makeObject(kernel.individual, parentSituation);
		},
		makeRelation: function (parentSituation) {
			return makeObject(kernel.relation, parentSituation);
		},
		makeInfon: function (parentSituation, relation, arcs) {
			var infon = makeObject(kernel.infon, parentSituation);
			infon.control.relation.set(relation);
			forEach(arcs, function (arg, role) {
				infon.control.arcs.set(role, arg);
				arg.control.involves.add(infon);
			});
			return infon;
		}
	};
})();



/*

<f:transaction name="makeObject">
	<f:param name="type" />
	<f:param name="parentSituation" />
	<xsl:template>
		<make type="{$type}" name="o" />
		<xsl:if test="$parentSituation">
			<int with="$o" prop="parentSituation" action="set">
				<param value="{$parentSituation}" />
			</int>
			<int with="{$parentSituation}" prop="childObjects" action="add">
				<param value="$o" />
			</int>
		</xsl:if>
		<return name="o" />
	</xsl:template>
</f:transaction>

<f:transaction name="makeSituation">
	<f:param name="parentSituation" />
	<xsl:template>
		<perform name="makeObject">
			<
		<



Transaction system
	Syntax for actions
	Syntax for data types and variables
		XML rep for sets, lists, etc?
	Calling other transactions
		Passing input and output



*/