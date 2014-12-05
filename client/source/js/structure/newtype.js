
// finds 'newtype' declarations in templates (which come from 'IDENTIFIER := TYPE' syntax),
// and applies them to any subsequent types, by simple substitution.
function desugarNewtype(o, env) {
  if(!o) return;
  if(!env) env = falseEnv;

  if(o.kind === "lineTemplate") {
    // newtypes hide previous bindings:
    env = envMinus(env, keys(o.newtype));

    // repeatedly go through newtypes, desugaring until stable:
    // (since newtypes may refer to each other in unordered, weird ways)
    var stable;
    do {
      stable = true; // assume nothing is going to happen
      for(var v in o.newtype) {
        // console.log(JSONtoString(o.newtype[v])+"<br/>");
        o.newtype[v] = substituteType(o.newtype[v], env); // desugar as much as possible for now

        if(env(v)!==o.newtype[v]) {
          // either hadn't been stored before or has changed.
          env = envAdd(env, v, o.newtype[v]);
          stable = false; // things are happening
        }
      }
    } while(!stable);

    // now we are done with newtypes; they have been incorporated into env.
    delete o.newtype;
  }

  if(typeLike(o.type)) // we assume all types are called 'type'
    o.type = substituteType(o.type, env);

  forEach(o, function(o) {desugarNewtype(o, env);});
}

function typeLike(o) {
  if(!o) return false;
  if(o.kind==="typeName" || o.kind==="typeApply" || o.kind==="typeLambda" || o.kind==="typeVar")
    return true;
  return false;
}
