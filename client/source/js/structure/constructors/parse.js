function parse(s) {
  return parseAndDesugar(makeTupleAST, makeListAST, s);
}

function parseAndDesugar(makeTuple, makeList, s) {
  /*
  Takes in a string and returns an AST.
  An AST is either an object {cons: "apply" || "lambda", left: AST, right: AST} or a String
  Strings are parsed like Haskell, here are the rules:
    apply's associate to the left, so f x y = (f x) y
      that is, f applied to x gives a function that is then applied to y
    lambda's associate to the right, so x -> y -> expr = x -> (y -> expr)
      that is, we have a function that takes a parameter x and gives a function that takes parameter y and gives expr
    apply's bind stronger than lambdas, so x -> f x = x -> (f x)

  Try it out:
    parse( "predicate -> bindSet (compose returnUnitSet (passthru predicate))" )
  */

  var tokens = s.split(/(\s+|\(|\)|->|"|\[|\]|\,)/); // extracts tokens: whitespace, "(", ")", "->", quotes ("), "[", "]", ",", and words (anything in between those symbols)

  function pullQuotedStrings(tokens) {
    var ret = [];
    var quoting = false;
    var qs = [];
    var prevBS = false;
    forEach(tokens, function (token) {
      if (!quoting) {
        if (token === '"') {
          quoting = true;
          qs = ['"'];
        } else {
          ret.push(token);
        }
      } else {
        if (token === '"' && !prevBS) {
          qs.push(token);
          ret.push(qs.join(""));
          quoting = false;
        } else {
          qs.push(token);
        }
      }
      if (token.charAt(token.length - 1) === "\\") {
        prevBS = true;
      } else {
        prevBS = false;
      }
    });
    if (quoting) {
      throw "Parse Error: Unbalanced quotes";
    }
    return ret;
  }
  tokens = pullQuotedStrings(tokens);

  // get rid of whitespace:
  tokens = filter(tokens, function(s) {return !(/^\s*$/.test(s));});

  /* parses tokens until a ")", "]", or "," token, if any.
   * leftAST is the current accumulation of applies.
   * returns the parsed expression, and removes all used tokens from tokens.
   */
  function parseOne(tokens, leftAST) {
    var ast;

    if(tokens.length===0) throw "Parse error: empty expression";

    // no valid expression begins with these tokens:
    if(tokens[0] === "->" || tokens[0] === ',' || tokens[0] === ']' || tokens[0] === ')')
      throw "Parse error: expression beginning with "+tokens[0];

    if(tokens[0] === "(") { // a grouping, potentially a tuple
      tokens.shift();

      var tuple = [parseOne(tokens)];
      while(tokens[0] === ',') { // accumulate tuple elements
        tokens.shift();
        tuple.push( parseOne(tokens) );
      }

      if(tokens[0] !== ")") throw "Parse error: missing )";
      tokens.shift();

      ast = makeTuple(tuple); // note that for a 1-tuple this is simply the first ast
    }

    else if(tokens[0] === "[") { // a list
      tokens.shift();

      var list = [parseOne(tokens)];
      while(tokens[0] === ',') { // accumulate list elements
        tokens.shift();
        list.push( parseOne(tokens) );
      }

      if(tokens[0] !== "]") throw "Parse error: missing ]";
      tokens.shift();

      ast = makeList(list);
    }

    else // a literal
      ast = tokens.shift();


    if(leftAST) // apply accumulated expressions to new one
      ast = makeApplyAST(leftAST, ast);

    // end of sub-expression?
    if(tokens.length === 0 || tokens[0] === ',' || tokens[0] === ']' || tokens[0] === ')')
      return ast;

    if(tokens[0] === "->") { // recurse on lambdas
      tokens.shift();
      return makeLambdaAST(ast, parseOne(tokens));
    }

    // otherwise, just one expression following another, i.e. an apply,
    // so pass along left part of apply:
    return parseOne(tokens, ast);
  }
  var ast = parseOne(tokens);

  if(tokens.length > 0) throw "Parse error: trailing tokens: "+tokens;

  return ast;
}


function unparse(ast, parens) {
  if (!parens) parens = 0;
  var ret;
  if (typeOf(ast) === "string") {
    return ast;
  } else if (ast.cons === "apply") {
    ret = unparse(ast.left, 2) + " " + unparse(ast.right, 1);
  } else if (ast.cons === "lambda") {
    ret = unparse(ast.left, 2) + " -> " + unparse(ast.right);
  }
  if ((parens === 2 && ast.cons === "lambda") || parens === 1) {
    return "(" + ret + ")";
  } else {
    return ret;
  }
}
