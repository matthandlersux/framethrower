/*

XML
  {kind: "for-each", select: AST, lineTemplate: LINETEMPLATE} | // this lineTemplate should take one (or two) parameters. It will get called with the for-each's key (and value if a Map) as its parameters.
  {kind: "call", lineTemplate: LINETEMPLATE} | // this lineTemplate should take zero parameters.
  {kind: "on", event: EVENT, action: LINETEMPLATE} | // this action should take zero parameters.
  {kind: "case", test: AST, lineTemplate: LINETEMPLATE, otherwise?: LINETEMPLATE} |
  // test should evaluate to a cell, if it is non-empty then lineTemplate is run as if it were a for-each. If it is empty, otherwise is called.
  // lineTemplate should take one parameter
  // otherwise, if it exists, should take zero parameters
  XMLNODE

XMLNODE
  {kind: "element", nodeName: STRING, attributes: {STRING: STRING | XMLINSERT}, style: {STRING: STRING | XMLINSERT}, children: [XML]} | // I have style separate from attributes just because the browser handles it separately
  {kind: "textElement", nodeValue: STRING | XMLINSERT}

XMLINSERT
  {kind: "insert", expr: AST}


*/


var DEBUGSPEED = false;



//
//
// /*
// This takes a parent DOM Node, some xml (in js form), and an environment and appends a Node the parent Node
// It returns:
//   {node: NODE, cleanup: FUNCTION}
// By calling this function, endCaps may be created which will update the node reactively.
// When cleanup() is called, these endCaps are removed.
// cleanup may be returned as null, in which case there's nothing to clean up.
// */
// function insertXML(parentNode, followingSibling, xml, env) {
//   function createSpacer() {
//     return createEl("f:spacer");
//   }
//
//   function place(node) {
//     if (followingSibling) {
//       parentNode.insertBefore(node, followingSibling);
//     } else {
//       parentNode.appendChild(node);
//     }
//   }
//
//   if (xml.node) {
//     place(xml.node);
//     return xml.cleanup;
//   }
//
//   var cleanupFunctions = [];
//   function pushCleanup(f) {
//     if (f) cleanupFunctions.push(f);
//   }
//   function cleanupReturn() {
//     if (cleanupFunctions.length > 0) {
//       return function () {
//         forEach(cleanupFunctions, function (cleanupFunction) {
//           cleanupFunction();
//         });
//       } else {
//         return null;
//       }
//     }
//   }
//
//   if (xml.kind === "element") {
//     if (xml.nodeName === "f:wrapper") {
//       forEach(xml.children, function (child) {
//         var insertion = insertXML(parentNode, followingSibling, child, env);
//         pushCleanup(insertion.cleanup);
//       });
//       return cleanupReturn();
//     } else {
//       var node = createEl(xml.nodeName);
//
//       forEach(xml.attributes, function (att, attName) {
//         pushCleanup(evaluateXMLInsert(att, env, function (value) {
//           setNodeAttribute(node, attName, value);
//         }));
//       });
//
//       forEach(xml.style, function (att, attName) {
//         pushCleanup(evaluateXMLInsert(att, env, function (value) {
//           setNodeStyle(node, attName, value);
//         }));
//       });
//
//       forEach(xml.children, function (child) {
//         var insertion = insertXML(node, undefined, child, env);
//         pushCleanup(insertion.cleanup);
//       });
//
//       place(node);
//       return cleanup: cleanupReturn();
//     }
//   } else if (xml.kind === "textElement") {
//     node = createTextNode();
//
//     pushCleanup(evaluateXMLInsert(xml.nodeValue, env, function (value) {
//       node.nodeValue = value;
//     }));
//
//     place(node);
//     return cleanupReturn();
//   } else if (xml.kind === "for-each") {
//
//     var select = parseExpression(xml.select, env);
//     var result = evaluate(select);
//
//     var spacer = createSpacer();
//     var spacer2 = createSpacer();
//     place(spacer);
//
//     var innerTemplate = makeClosure(xml.lineTemplate, env);
//
//     if (result.kind === "list") {
//       forEach(result.asArray, function (value) {
//         var newXMLP = evaluate(makeApply(innerTemplate, value));
//         pushCleanup(insertXML(parentNode, spacer, newXMLP.xml, newXMLP.env));
//         return cleanupReturn();
//       });
//     } else {
//       // set up an endCap to listen to result and place appropriately
//
//       function cmp(a, b) {
//         // returns -1 if a < b, 0 if a = b, 1 if a > b
//         if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(a)) {
//           return a - b;
//         } else {
//           if (a < b) return -1;
//           else if (a > b) return 1;
//           else return 0;
//         }
//       }
//
//
//
//
//
//
//       var entries = {}; // this is a hash of stringified values (from the Unit/Set/Map result) to the evaluated template's {node: NODE, cleanup: FUNCTION}
//
//
//       var feachInjectedFunc = result.inject(emptyFunction, function (value) {
//
//         var newNode, keyString;
//
//         if (result.isMap) {
//           //DEBUG
//           if (xml.lineTemplate.params.length !== 2) debug.error("f:each running on map, but as doesn't have key, value");
//           newNode = evaluate(makeApply(makeApply(innerTemplate, value.key), value.val));
//           keyString = stringify(value.key);
//         } else {
//           newNode = evaluate(makeApply(innerTemplate, value));
//           keyString = stringify(value);
//         }
//
//         newNode = xmlToDOM(newNode.xml, newNode.env, context);
//
//
//         // find where to put the new node
//         // NOTE: this is linear time but could be log time with clever algorithm
//         var place = null; // this will be the key which comes immediately after the new node
//         forEach(entries, function (entry, entryKey) {
//           if (cmp(keyString, entryKey) < 0 && (place === null || cmp(entryKey, place) < 0)) {
//             place = entryKey;
//           }
//         });
//
//         if (place === null) {
//           // tack it on at the end
//           wrapper.appendChild(newNode.node);
//         } else {
//           // put it before the one that comes immediately afterwards
//           wrapper.insertBefore(newNode.node, entries[place].node);
//         }
//
//         entries[keyString] = newNode;
//
//         return function () {
//
//           if (newNode.cleanup) {
//             newNode.cleanup();
//           }
//           wrapper.removeChild(newNode.node);
//
//           delete entries[keyString];
//         };
//       });
//
//       function cleanupAllEntries() {
//         //console.log("cleaning up an entire f:each", entries);
//
//         // I don't need the below because when feachCleanup is called, all entries are removed, one-by-one, automatically (by cell logic)
//         // forEach(entries, function (entry, entryKey) {
//         //   console.log("cleaning up an entry", entry, entryKey);
//         //   if (entry.cleanup) entry.cleanup();
//         // });
//
//         feachInjectedFunc.unInject();
//       }
//
//       return {node: wrapper, cleanup: cleanupAllEntries};
//     }
//
//   }
// }
//





/*
This takes some xml (in js form) and an environment and creates a DOM Node, returning
  {node: NODE, cleanup: FUNCTION}
By calling this function, endCaps may be created which will update the node reactively.
When cleanup() is called, these endCaps are removed.
cleanup may be returned as null, in which case there's nothing to clean up.
*/
function xmlToDOM(xml, env, context, lastElement) {

  // I've added this convenience, XMLP can have as its xml property a {node: --, cleanup: --} in which case it is already DOM.
  // I use this for javascript creating quicktime embeds.
  if (xml.node) {
    return xml;
  }

  if (context === undefined) context = "html";

  function createWrapper() {
    if (context === "html") return createEl("f:wrapper");
    else if (context === "svg") return createEl("svg:g");
  }

  var cleanupFunctions = [];
  function pushCleanup(f) {
    if (f) cleanupFunctions.push(f);
  }

  var node;

  if (xml.kind === "element") {
    var newLastElement = lastElement;
    if (xml.nodeName === "f:wrapper") {
      node = createWrapper();
    } else {
      node = createEl(xml.nodeName);
      newLastElement = node;
    }

    var newContext = (xml.nodeName.substring(0,4) === "svg:") ? "svg" : context;

    //process special attributes like focus
    checkAttributes(xml.attributes, node);

    forEach(xml.attributes, function (att, attName) {
      pushCleanup(evaluateXMLInsert(att, env, function (value) {
        setNodeAttribute(node, attName, value);
      }));
    });

    forEach(xml.style, function (att, attName) {
      pushCleanup(evaluateXMLInsert(att, env, function (value) {
        setNodeStyle(node, attName, value);
      }));
    });

    forEach(xml.children, function (child) {
      var childNodeCleanup = xmlToDOM(child, env, newContext, newLastElement);
      try {
        node.appendChild(childNodeCleanup.node);
      } catch (e) {
        console.log("had a problem", childNodeCleanup, xml, child);
        throw e;
      }

      pushCleanup(childNodeCleanup.cleanup);
    });

    refreshWhenDone();
  } else if (xml.kind === "textElement") {
    node = createTextNode();

    pushCleanup(evaluateXMLInsert(xml.nodeValue, env, function (value) {
      node.nodeValue = value;
    }));

    refreshWhenDone();
  } else if (xml.kind === "for-each") {
    //var select = parseExpression(parse(xml.select), env);
    var select = parseExpression(xml.select, env);
    var result = evaluate2(select);

    var wrapper = createWrapper();

    var innerTemplate = makeClosure(xml.lineTemplate, env);

    if (result.kind === "list") {
      forEach(result.asArray, function (value) {
        var newNode = evaluate(makeApply(innerTemplate, value));
        newNode = xmlToDOM(newNode.xml, newNode.env, context, lastElement);
        wrapper.appendChild(newNode.node);
        pushCleanup(newNode.cleanup);
      });
      node = wrapper;
    } else {
      // set up an endCap to listen to result and change the children of the wrapper

      function cmp(a, b) {
        // returns -1 if a < b, 0 if a = b, 1 if a > b
        if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(a)) {
          return a - b;
        } else {
          if (a < b) return -1;
          else if (a > b) return 1;
          else return 0;
        }
      }



      var entries = {}; // this is a hash of stringified values (from the Unit/Set/Map result) to the evaluated template's {node: NODE, cleanup: FUNCTION}

      if (!result.inject) {
        console.error("Runtime error with f:each", result);
      }

      var feachInjectedFunc = result.inject(emptyFunction, function (value) {

        var newNode, keyString;

        if (result.isMap) {
          //DEBUG
          if (xml.lineTemplate.params.length !== 2) debug.error("f:each running on map, but as doesn't have key, value");
          newNode = evaluate(makeApply(makeApply(innerTemplate, value.key), value.val));
          keyString = stringify(value.key);
        } else {
          newNode = evaluate(makeApply(innerTemplate, value));
          keyString = stringify(value);
        }

        newNode = xmlToDOM(newNode.xml, newNode.env, context, lastElement);


        // find where to put the new node
        // NOTE: this is linear time but could be log time with clever algorithm
        var place = null; // this will be the key which comes immediately after the new node
        forEach(entries, function (entry, entryKey) {
          if (cmp(keyString, entryKey) < 0 && (place === null || cmp(entryKey, place) < 0)) {
            place = entryKey;
          }
        });

        if (place === null) {
          // tack it on at the end
          wrapper.appendChild(newNode.node);
        } else {
          // put it before the one that comes immediately afterwards
          wrapper.insertBefore(newNode.node, entries[place].node);
        }
        refreshWhenDone();

        entries[keyString] = newNode;

        return function () {

          if (newNode.cleanup) {
            newNode.cleanup();
          }
          wrapper.removeChild(newNode.node);
          refreshWhenDone();

          delete entries[keyString];
        };
      });

      function cleanupAllEntries() {
        //console.log("cleaning up an entire f:each", entries);

        // I don't need the below because when feachCleanup is called, all entries are removed, one-by-one, automatically (by cell logic)
        // forEach(entries, function (entry, entryKey) {
        //   console.log("cleaning up an entry", entry, entryKey);
        //   if (entry.cleanup) entry.cleanup();
        // });

        feachInjectedFunc.unInject();
      }

      return {node: wrapper, cleanup: cleanupAllEntries};
    }



  } else if (xml.kind === "case") {
    // TODO: right now, case only works if the predicate is of type Unit a. Figure out what we want it to do for other types...

    // TODO: test this for memory leaks, I think it's good though.

    // {kind: "case", test: AST, lineTemplate: LINETEMPLATE, otherwise?: LINETEMPLATE | CASE}

    var select = parseExpression(xml.test, env);
    var result = evaluate2(select);

    var wrapper = createWrapper();

    // set up an endCap to listen to result and change the children of the wrapper

    var innerTemplate = makeClosure(xml.lineTemplate, env);
    var otherwiseTemplate = xml.otherwise ? makeClosure(xml.otherwise, env) : undefined;

    var childNode = null;

    function clearIt() {
      if (childNode) {
        if (childNode.cleanup) childNode.cleanup();
        wrapper.removeChild(childNode.node);
        childNode = null;
      }
    }

    function printOccupied(value) {
      clearIt();
      var tmp = evaluate(makeApply(innerTemplate, value));
      childNode = xmlToDOM(tmp.xml, tmp.env, context, lastElement);
      wrapper.appendChild(childNode.node);
    }
    function printOtherwise() {
      clearIt();
      if (otherwiseTemplate) {
        childNode = xmlToDOM(otherwiseTemplate.xml, otherwiseTemplate.env, context, lastElement);
        wrapper.appendChild(childNode.node);
      }
    }

    var occupied = false;
    var injectedFunc = result.inject(emptyFunction, function (value) {
      occupied = true;
      printOccupied(value);
      return function () {
        printOtherwise();
      };
    }, undefined, true);

    function cleanupCase() {
      injectedFunc.unInject();
      clearIt();
    }

    if (!occupied) {
      printOtherwise();
    }

    return {node: wrapper, cleanup: cleanupCase};
  } else if (xml.kind === "call") {
    //var xmlp = makeClosure(xml.lineTemplate, env);
    var xmlp = evaluate(makeClosure(xml.lineTemplate, env));
    return xmlToDOM(xmlp.xml, xmlp.env, context, lastElement);
  } else if (xml.kind === "on") {
    var node = createEl("f:on");
    if (xml.event === "init") {
      setTimeout(function () {
        var action = makeClosure(xml.action, env);
        executeAction(action, function() {session.flush();});
      }, 0);
      return {node: node, cleanup: null};
    } else if (xml.event === "uninit") {
      return {node: node, cleanup: function () {
        setTimeout(function() {
          var action = makeClosure(xml.action, env);
          executeAction(action);
        });
      }};
    } else {
      var eventName, eventGlobal;
      if (xml.event.substr(0, 6) === "global") {
        eventName = xml.event.substr(6);
        eventGlobal = true;
      } else {
        eventName = xml.event;
        eventGlobal = false;
      }


      if (eventGlobal) {
        if (!globalEventHandlers[eventName]) {
          globalEventHandlers[eventName] = {};
        }
        var identifier = localIds();
        globalEventHandlers[eventName][identifier] = {
          action: xml.action,
          env: env
        };
        function cleanupGlobal() {
          delete globalEventHandlers[eventName][identifier];
        }
        return {node: createWrapper(), cleanup: cleanupGlobal};
      } else {
        var fonNode = createEl("f:on");
        setAttr(fonNode, "event", eventName);
        fonNode.custom = {};
        fonNode.custom.action = xml.action;
        fonNode.custom.env = env;

        if (!lastElement) {
          console.log("Trying to attach a f:on to nothing");
        } else {
          lastElement.appendChild(fonNode);
          attachEventStyle(lastElement, eventName);
          if (eventName === "domMove") {
            setTimeout(function () {
              extraEnv = makeEventExtrasEnv(env, {target:lastElement});
              var action = makeClosure(xml.action, extraEnv);
              executeAction(action, function() {session.flush();});
            }, 0);
          }
        }
        function cleanupOn() {
          lastElement.removeChild(fonNode);
          removeEventStyle(lastElement, eventName);
          fonNode.custom = null;
        }
        return {node: createWrapper(), cleanup: cleanupOn};


        // setAttr(node, "event", eventName);
        // node.custom = {};
        // node.custom.action = xml.action;
        // node.custom.env = env;
        //
        // function cleanupOn() {
        //   node.custom = null; // for garbage collection in stupid browsers
        // }
        // return {node: node, cleanup: cleanupOn};
      }
    }
  } else if (xml.kind === "trigger") {
    var node = createWrapper(); // I just need to return something
    var cleanupFunc = null;

    // I wrap the registering of triggers in a setTimeout to ensure that they come after everything else. Otherwise there are timing bugs.
    var myTimer = setTimeout(function () {

      cleanupFunc = false;

      var actionClosure = makeClosure(xml.action, env);

      //var expr = parseExpression(parse(xml.trigger), env);
      var expr = parseExpression(xml.trigger, env);
      //var cell = evaluate(expr);
      var injectedFunc = evaluateAndInject(expr, emptyFunction, function (val) { // TODO: maybe we should be doing key/val for Map's...

        var action = evaluate(makeApply(actionClosure, val));
        executeAction(action, function() {session.flush();});
      });
      cleanupFunc = function () {
        injectedFunc.unInject();
      };
    }, 0);

    function cleanupTrigger() {
      if (cleanupFunc) cleanupFunc();
      else if (cleanupFunc === null) {
        clearTimeout(myTimer);
      } else if (cleanupFunc === false) {
        debug.error("A trigger has triggered its own removal. The culprit:", unparse(xml.trigger));
        //setTimeout(cleanup, 0);
      }
    }

    return {node: node, cleanup: cleanupTrigger};
  }

  var cleanupDefault = null;
  if (cleanupFunctions.length > 0) {
    cleanupDefault = function () {
      forEach(cleanupFunctions, function (cleanupFunction) {
        cleanupFunction();
      });
    };
  }

  return {node: node, cleanup: cleanupDefault};
}






var serializeCell = parseExpr("serialize");

// this evaluates an xml insert (or just a string) and sends the result through the callback (perhaps reactively)
// returns null or a function that when called does cleanup (removes all created endCaps)
function evaluateXMLInsert(xmlInsert, env, callback) {
  if (typeOf(xmlInsert) === "string") {
    callback(xmlInsert);
    return null;
  } else {
    var expr = parseExpression(xmlInsert.expr, env);
    //var expr = parseExpression(parse(xmlInsert.expr), env);
    var result = evaluate2(expr);

    //console.log("doing an insert", expr, result);

    // if result is a cell, hook it into an endcap that converts it to a string
    if (result.kind === "cell") {
      var serialized = makeApply(serializeCell, result);
      var injectedFunc = evaluateAndInject(serialized, emptyFunction, callback); // NOTE: might want to wrap callback so that it returns an empty function?
      return injectedFunc.unInject;
    } else {
      callback(convertStateToString(result));
      return null;
    }
  }
}




var refreshingWhenDone;
function refreshWhenDone() {
  if (!refreshingWhenDone) {
    refreshingWhenDone = setTimeout(function () {
      checkForDomMoves(document.body);
      refreshingWhenDone = false;
    }, 0);
  }
}