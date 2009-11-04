/*
A Type is any one of the following:
	*	{
			kind: "typeName",
			value: String
		}
	*	{
			kind: "typeVar",
			value: String
		}
	*	{
			kind: "typeApply",
			left: Type,
			right: Type
		}
	*	{
			kind: "typeLambda",
			left: Type,
			right: Type
		}
*/


function parseType(s) {
	/*
	Takes in a string and returns a Type.
	After parsing to an AST,
		apply's get turned into typeApply's, lambda's get turned into typeLambda's
		capitalized strings get turned into typeName's
		lowercase strings get turned into typeVar's
			also, these get renamed using typeVarGen,
			this way no Type's ever use the same typeVar name twice (unless they correspond)
	*/
	
	function isCapitalized(s) {
		var fc = s.charAt(0);
		return fc === fc.toUpperCase();
	}
	
	var typeVars = {};
	
	function helper(ast) {
		if (typeOf(ast) === "string") {
			if (isCapitalized(ast)) {
				return {
					kind: "typeName",
					value: ast
				};
			} else {
				/*if (!typeVars[ast]) {
					typeVars[ast] = makeFreshTypeVar();
				}
				return typeVars[ast];*/
				return makeTypeVar(ast);
			}
		} else if (ast.cons === "apply") {
			return makeTypeApply(helper(ast.left), helper(ast.right));
		} else if (ast.cons === "lambda") {
			return makeTypeLambda(helper(ast.left), helper(ast.right));
		}
	}
	
	function makeTupleType(elements) {
		if(elements.length>1)
			return makeAppliesAST("Tuple"+elements.length, elements);
		else
			return elements[0];
	}
	function makeListType(elements) {
		if(elements.length!==1) throw "Type parse error: list type not of form [a]";
		return makeApplyAST("List", elements[0]);
	}
	
	return helper(parseAndDesugar(makeTupleType, makeListType, s));
}

function unparseType(type) {
	function helper(type) {
		if (type.kind === "typeName" || type.kind === "typeVar") {
			return type.value;
		} else if (type.kind === "typeApply") {
			return makeApplyAST(helper(type.left), helper(type.right));
		} else if (type.kind === "typeLambda") {
			return makeLambdaAST(helper(type.left), helper(type.right));
		}
	}
	return unparse(helper(type));
}


// returns true if the types are the same up to alpha-conversion
function compareTypes(type1, type2) {
	var correspond12 = {};
	var correspond21 = {};
	function helper(type1, type2) {
		if (type1.kind !== type2.kind) return false;
		if (type1.kind === "typeName") {
			return type1.value === type2.value;
		} else if (type1.kind === "typeVar") {
			var c12 = !correspond12[type1.value] || correspond12[type1.value] === type2.value;
			var c21 = !correspond21[type2.value] || correspond21[type2.value] === type1.value;
			if (c12 && c21) {
				correspond12[type1.value] = type2.value;
				correspond21[type2.value] = type1.value;
				return true;
			} else {
				return false;
			}
		} else {
			return (helper(type1.left, type2.left) && helper(type1.right, type2.right));
		}
	}
	return helper(type1, type2);
}


function buildType(explicitType, templateTypeString, typeToBuildString) {
	var templateType = parseType(templateTypeString);
	var typeToBuild = parseType(typeToBuildString);
	
	var typeVars = {};
	function bindVars(explicit, template) {
		if (template.kind === "typeVar") {
			typeVars[template.value] = explicit;
		} else if (template.kind === "typeLambda" || template.kind === "typeApply") {
			bindVars(explicit.left, template.left);
			bindVars(explicit.right, template.right);
		}
	}
	bindVars(explicitType, templateType);
	
	function build(type) {
		if (type.kind === "typeVar") {
			return typeVars[type.value];
		} else if (type.kind === "typeName") {
			return type;
		} else {
			return {
				kind: type.kind,
				left: build(type.left),
				right: build(type.right)
			};
		}
	}
	
	return build(typeToBuild);
}

function getTypeConstructor(type) {
	var constructor = type;
	while (constructor.kind === "typeApply") {
		constructor = constructor.left;
	}
	constructor = constructor.value;
	return constructor;
}


function isReactive(type) {
	var constructor = getTypeConstructor(type);
	return constructor === "Set" || constructor === "Map" || constructor === "Unit";
}






var basicTypes = {
	string: makeTypeName("String"),
	number: makeTypeName("Number"),
	"boolean": makeTypeName("Bool")
};
//var jsType = makeTypeName("JS"); // this is for all miscellaneous types
//var xmlType = makeTypeName("XML");
//var unitJS = parseType("Unit JS");

var jsonType = makeTypeName("JSON");
// var instructionType = makeTypeName("Instruction");
var actionType = makeTypeName("Action");










var typeVarGen = makeGenerator("t");
function makeFreshTypeVar() {
	return makeTypeVar(typeVarGen());
}





function imposeSub(type, name, value) {
	if (type.kind === "typeName") {
		return type;
	} else if (type.kind === "typeVar") {
		if (type.value === name) {
			return value;
		} else {
			return type;
		}
	} else {
		return {
			kind: type.kind,
			left: imposeSub(type.left, name, value),
			right: imposeSub(type.right, name, value)
		};
	}
}




function getTypeOfExpr(expr) {
	function freshenType(type) {
		var typeVars = {};

		function helper(type) {
			if (type.kind === "typeName") {
				return type;
			} else if (type.kind === "typeVar") {
				if (!typeVars[type.value]) {
					typeVars[type.value] = makeFreshTypeVar();
				}
				return typeVars[type.value];
			} else if (type.kind === "typeLambda" || type.kind === "typeApply") {
				return {
					kind: type.kind,
					left: helper(type.left),
					right: helper(type.right)
				};
			}
		}

		return helper(type);
	}

	function genConstraints(expr, lambdaStack, constraints) {
		/* MUTATES: constraints
		this function returns the type of expr, but also adds to constraints (which must be unified and imposed)

		env is a map of variable names to Expr's, initially emptyEnv
		constraints is a list (initially empty) of contraints, where each constraint is a pair (length-2 list) of types which must be equal
		expr is an Expr

		Algorithm: if expr is
			a variable
				return getType(env(expr.value))
			a non-cons
				return getType(expr)
			an application (funExpr inputExpr)
				run genConstraints on funExpr -> funType
				run genConstraints on inputExpr -> inputType
				make a fresh variable -> vName
				add constraint funType = inputType -> vName
				return vName
			a lambda (\x -> expr2)
				make a fresh variable -> vName
				return vName -> (genConstraints on expr2 using env augmented with x::vName)
		*/

		// optimization
		if (expr.type) {
			return freshenType(expr.type);
		}

		if (expr.kind === "exprVar") {
			return lambdaStack[expr.deBruijn - 1];
		} else if (expr.kind === "exprApply") {
			var funType;
			// if (getOutsideScope(expr.left) === 0) {
			// 	funType = freshenType(getType(expr.left));
			// } else {
				funType = genConstraints(expr.left, lambdaStack, constraints);
			// }
			var inputType;
			// if (getOutsideScope(expr.right) === 0) {
			// 	inputType = freshenType(getType(expr.right));
			// } else {
				inputType = genConstraints(expr.right, lambdaStack, constraints);
			// }
			var freshType = makeFreshTypeVar();
			constraints.push([funType, makeTypeLambda(inputType, freshType)]);
			return freshType;
		} else if (expr.kind === "exprLambda") {
			var freshType = makeFreshTypeVar();
			var newLambdaStack = [freshType].concat(lambdaStack);
			return makeTypeLambda(freshType, genConstraints(expr.expr, newLambdaStack, constraints));
		} else {
			return freshenType(getType(expr));
		}
	}

	function containsVar(type, typeVar) {
		if (type.kind === "typeName") {
			return false;
		} else if (type.kind === "typeVar") {
			return type.value === typeVar.value;
		} else {
			return containsVar(type.left, typeVar) || containsVar(type.right, typeVar);
		}
	}

	function getFreeVariables(expr) {
		if (expr.freeVariables) {
			return expr.freeVariables;
		} else {
			if (expr.kind === "exprVar") {
				expr.freeVariables = {};
				expr.freeVariables[expr.value] = true;
				return expr.freeVariables;
			} else if (expr.kind === "exprApply") {
				expr.freeVariables = merge(getFreeVariables(expr.left), getFreeVariables(expr.right));
				return expr.freeVariables;
			} else if (expr.kind === "exprLambda") {
				var right = getFreeVariables(expr.right);
				expr.freeVariables = merge(right);
				delete expr.freeVariables[expr.left.value];
				return expr.freeVariables;
			} else {
				return {};
			}
		}
	}

	function unify(constraints) {
		// MUTATES: constraints
		//given constraints, returns subs or throws an error

		// TODO: make subs a hash, make it do the substitutions in subOnConstraints, then make imposeSubs only have to do one pass, also can do subOnConstraints stuff to constraints as they are gotten to.
		// the idea is to reduce passes through the type tree (like an imposeSub or a hashed imposeSubs)


		var subs = {};
		var madeSub = false;

		function addSub(name, value) {
			madeSub = true;
			forEach(subs, function (expr, subName) {
				subs[subName] = imposeSub(expr, name, value);
			});
			subs[name] = value;
		}


		while (constraints.length !== 0) {
			var constraint = constraints.shift(); // take a constraint from the front of the list

			if (madeSub) {
				constraint[0] = imposeSubs(constraint[0], subs);
				constraint[1] = imposeSubs(constraint[1], subs);
			}

			var left = constraint[0];
			var right = constraint[1];

			if (left.kind === "typeName" && right.kind === "typeName") {
				if (left.value !== right.value) {
					debug.error("Type mismatch between `"+left.value+"` and `"+right.value+"`.");
				}
				// otherwise ignore
			} else if (left.kind === "typeVar" && right.kind === "typeVar" && left.value === right.value) {
				// ignore
			} else if (left.kind === "typeVar" && !containsVar(right, left)) {
				// add substitution
				addSub(left.value, right);
			} else if (right.kind === "typeVar" && !containsVar(left, right)) {
				// add substitution
				addSub(right.value, left);
			} else if (left.kind === right.kind) {
				// add two new constraints to the end of the list
				constraints.push([left.left, right.left]);
				constraints.push([left.right, right.right]);
			} else {
				debug.error("Type mismatch, unresolveable: `"+unparseType(left)+"` and `"+unparseType(right)+"`");
				//throw "Type mismatch, unresolveable: `"+unparseType(left)+"` and `"+unparseType(right)+"`";
			}
		}

		return subs;
	}




	function imposeSubs(type, subs) {
		if (type.kind === "typeName") {
			return type;
		} else if (type.kind === "typeVar") {
			var lookup = subs[type.value];
			if (lookup) {
				return lookup;
			} else {
				return type;
			}
		} else {
			return {
				kind: type.kind,
				left: imposeSubs(type.left, subs),
				right: imposeSubs(type.right, subs)
			};
		}
	}
	
	
	var constraints = [];
	var t = genConstraints(expr, [], constraints);
	var subs = unify(constraints);
	return imposeSubs(t, subs);
}








function getType(o) {
	var t = typeOf(o);
	if (basicTypes[t]) {
		return basicTypes[t];
	} else { //object
		if (!o.type) {
			if (o.kind !== "exprApply" && o.kind !== "exprLambda") {
				//debug.error("Expected this expression to have a type: ", o);
				return jsonType;
			}
			//console.log("Getting type of expression.", stringify(o));
			o.type = getTypeOfExpr(o);
		}
		return o.type;
	}
}






