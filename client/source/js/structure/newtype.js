
// finds 'newtype' declarations in templates (which come from 'IDENTIFIER := TYPE' syntax),
// and applies them to any subsequent types, by simple substitution.
function desugarNewtype(o, env) {
	if(!o) return;
	if(!env) env = falseEnv;
	
	// if(o.kind === "lineTemplate") {
	// 	// newtypes hide previous bindings:
	// 	env = envMinus(env, keys(o.newtype));
	// 	
	// 	// repeatedly go through newtypes, substituting until stable:
	// 	// (since newtypes may refer to each other in unordered, weird ways)
	// 	var stable;
	// 	do {
	// 		stable = true; // assume nothing is going to happen
	// 		for(var v in template.newtype) {
	// 			var type0 = template.newtype[v];
	// 		
	// 			if(let.kind === "lineExpr" && hasVariable(let.expr, fetchEnv)) { // has a 'fetch'
	// 					// store the value and get rid of the let, since it is meaningless to anyone else:
	// 					env = envAdd(env, v, let.expr);
	// 					delete template.let[v];
	// 					stable = false; // things are happening
	// 			}
	// 		}
	// 	} while(!stable);
	// }
	
	if(o.type) // we assume every entry called 'type' is a type
		o.type = substituteType(o.type, env);
}