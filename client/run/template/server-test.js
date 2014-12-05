// preparse(mainTemplate);

// desugarFetch(mainTemplate);


//var compiledTemplate = makeClosure(mainTemplate, base.env);


var testSharedEnv;
var cell;

function send(string) {
  cell = session.query(parseExpr(string));
  session.flush();
  cell.inject(function() {}, function(val) {
    console.log("Got val:", val, " for expr: ", string);
  });
}

function sendDebug(string) {
  session.debugQuery(string);
  session.flush();
}

function sendAndRemove(string) {
  cell = session.query(parseExpr(string));
  session.flush();
  var cellMethods = cell.inject(function() {}, function(val) {
    console.log("Got val:", val, " for expr: ", string);
  });
  cellMethods.unInject();
}


function perform(string) {
  var callback = function (result) {
    console.log("Action Result:", result, "for action: ", string);
    session.flush();
  };
  executeAction(evaluate(parseExpr(string, testSharedEnv)), callback);
}


function initialize() {
  function initMainTemplate (env) {
    var compiledTemplate = evaluate(makeClosure(mainTemplate, env));

    var node = xmlToDOM(compiledTemplate.xml, compiledTemplate.env);

    document.body.appendChild(node.node);

    document.body.focus();
  }

  if (LOCAL) {
    // add sharedLets to regular lets
    if (mainTemplate.sharedLet !== undefined) {
      forEach(mainTemplate.sharedLet, function(sharedLet, name) {
        mainTemplate.let[name] = sharedLet;
      });
    }

    //add action in initMrg as <f:on init> in main template
    var fon = {
      kind: "on",
      event: "init",
      action: mainTemplate.initMrg
    };
    mainTemplate.output.xml.children.push(fon);

    initMainTemplate(base.env);

  } else {
    //Get shared lets from server and insert them into the environment
    session.getSharedLets(mainTemplate, function(sharedLets) {
      var sharedEnv = extendEnv(base.env, sharedLets);
      testSharedEnv = sharedEnv;
      initMainTemplate(sharedEnv);
      setTimeout(session.flush,0);
    });
  }
}