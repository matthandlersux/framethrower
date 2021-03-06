var semantics = function(){
  var filename;


  // ==================================
  // UTIL
  // ==================================

  function addDebugRef(obj, debugRef) {
    if(objectLike(obj)) {
      forEach(obj, function(value) {
        addDebugRef(value, debugRef);
      });
      obj.debugRef = debugRef;
    }
  }

  //this should cover all the weird constructs that need to be made into lists
  //TODO: make all these constructs uniform in the parser
  function makeList(node, listName, nextName, onEachFunc) {
    //this handles nodes that are already lists
    if (node !== undefined && arrayLike(node)) {
      if (def(onEachFunc)) {
        var output = [];
        forEach(node, function(elem) {
          output.push(onEachFunc(elem));
        });
        return output;
      } else {
        return node;
      }
    } else {
      function helper(node) {
        if(node === undefined || node === {}) return [];
        if(def(node[nextName]) && node[nextName] !== {}) {
          var ret = helper(node[listName]);
          if(def(onEachFunc)) {
            ret.push(onEachFunc(node[nextName]));
          } else {
            ret.push(node[nextName]);
          }
          return ret;
        } else {
          return helper(node[listName]);
        }
      }
      return helper(node);
    }
  }

  function makeListFlatten(node, listName, nextName, onEachFunc) {
    function helper(node) {
      if(node == undefined || node == {}) return [];
      if(def(node[nextName]) && node[nextName] !== {}) {
        var ret = helper(node[listName]);
        if(def(onEachFunc)) {
          return ret.concat(onEachFunc(node[nextName]));
        } else {
          return ret.concat(node[nextName]);
        }
      } else {
        return helper(node[listName]);
      }
    }
    return helper(node);
  }

  //this does the same thing as makeList but return an object
  function makeListObject(node, listName, nextName, getKeyVal) {
    if (node !== undefined && arrayLike(node)) {
      var output = {};
      forEach(node, function(elem) {
        var keyval = getKeyVal(elem);
        output[keyval.key] = keyval.val;
      });
      return output;
    } else {
      function helper (node) {
        if(node == undefined || node == {}) return {};
        if(def(node[nextName]) && node[nextName] !== {}) {
          var ret = helper(node[listName]);
          var keyval = getKeyVal(node[nextName]);
          ret[keyval.key] = keyval.val;
          return ret;
        } else {
          return helper(node[listName]);
        }
      }
      return helper(node);
    }
  }

  function toCamelCase(hyphenatedString) {
    function cnvrt(string) {
          return string.substr(1, 1).toUpperCase();
      }
    return hyphenatedString.replace(/\-./g, cnvrt);
  }


  // ====================================================
  // Make Functions
  // ====================================================

  function makeActionTemplate (node) {
    var fullActList = node.fullactlist;

    var allActList = makeList(fullActList.actlist, 'actlist', 'actline');
    if (def(fullActList.action)) {
      allActList.push({action: fullActList.action, debugRef: fullActList.action.debugRef});
    }

    //split list into letlists (something = something, or something := something) and actionLine (something <- something)
    var actlist = [];
    var letlist = {};
    var actionFound = false;

    for(var i=0; i<allActList.length; i++) {
      var listElement = allActList[i];
      if (def(listElement.equals) || def(listElement.colonequals)) { // LET or NEWTYPE
        if (actionFound) {
          var subActionTemplate = {actiontpl: {fullactlist: {actlist: allActList.slice(i)}, debugRef:listElement.debugRef}};
          var lineAction = {
            action: makeLine(subActionTemplate),
            debugRef: listElement.debugRef
          };
          actlist.push(lineAction);
          break;
        }
        if(def(listElement.equals))
          letlist = {letlist: letlist, let: listElement};
        else if(def(listElement.colonequals))
          letlist = {letlist: letlist, newtype: listElement};

      } else { // ACTION | IDENTIFIER <- ACTION | IDENTIFIER <~ EXPR

        if (def(listElement.lttilde)) {
          // 'x <~ y::T' desugars to 'x <- return (y)::Action T':
          var expr = listElement.expr;
          expr.exprcode = "return ("+expr.exprcode+")";
          if(def(expr.type))
            expr.type = "Action ("+expr.type+")";
          listElement.action = {expr: expr, debugRef: expr.debugRef};
        }

        var output = {
          action: makeLine(listElement.action),
          debugRef: listElement.debugRef
        };
        if (def(listElement.identifier)) {
          output.name = listElement.identifier;
        }
        actlist.push(output);

        actionFound = true;
      }
    }

    var lastActionType = node.type;
    if (!def(lastActionType)) {
      lastActionType = "Action a0";
    } else {
      lastActionType = "Action (" + lastActionType + ")";
    }

    var actionLine = {lineAction: {kind: "lineAction", actions: actlist}, type: lastActionType};

    var wrappedTemplate = {
      arglist: node.arglist,
      fullletlist: {
        letlist: letlist,
        line: actionLine
      },
      debugRef: node.debugRef
    };

    return makeLineTemplate(wrappedTemplate);
  }

  function makeAskeyval (node) {
    var arglist = {};
    if (def(node.identifier)) {
      arglist = {variable:{identifier:node.identifier}, arglist: arglist};
    }
    if (def(node.identifier2)) {
      arglist = {variable:{identifier:node.identifier2}, arglist: arglist};
    }
    return arglist;
  }

  function makeIfblock (node) {
    var wrappedTemplate = {
      arglist: makeAskeyval(node.askeyval),
      fullletlist: node.fullletlist,
      debugRef: node.debugRef
    };

    var template = makeLineTemplate(wrappedTemplate);

    var wrappedElseblock;
    if (def(node.fullletlist2)) {
      wrappedElseblock = {
        arglist: {},
        fullletlist: node.fullletlist2,
        debugRef: node.debugRef
      };
    } else if (def(node.ifblock)) {
      //if block else if sugar
      wrappedElseblock = {
        arglist: {},
        fullletlist: {
          line: {ifblock: node.ifblock}
        },
        debugRef: node.debugRef
      };
    }
    else throw "no else clause!";
    var otherwise = makeLineTemplate(wrappedElseblock);

    return {
      kind: "case",
      test: parse(node.expr.exprcode),
      lineTemplate: template,
      otherwise: otherwise,
      debugRef: node.debugRef
    };
  }

  function makeIfaction (node) {
    var wrappedTemplate = {
      arglist: makeAskeyval(node.askeyval),
      fullactlist: node.fullactlist,
      debugRef: node.debugRef
    };

    var template = makeActionTemplate(wrappedTemplate);

    var wrappedElseblock;
    if (def(node.fullactlist2)) {
      wrappedElseblock = {
        arglist: {},
        fullactlist: node.fullactlist2,
        debugRef: node.debugRef
      };
    } else if (def(node.ifaction)) {
      //if block else if sugar
      wrappedElseblock = {
        arglist: {},
        fullactlist: {
          action: {ifaction: node.ifaction}
        },
        debugRef: node.debugRef
      };
    }
    else throw "no else clause!";
    var otherwise = makeActionTemplate(wrappedElseblock);

    return {
      kind: "case",
      test: parse(node.expr.exprcode),
      lineTemplate: template,
      otherwise: otherwise,
      debugRef: node.debugRef
    };
  }

  function makeFunction(funcObject, jsTransformer, outputTypeTransformer) {
    var JS = funcObject.functionbody;
    if(jsTransformer)
      JS = jsTransformer(JS);


    var outputType = funcObject.type;
    if (outputType && outputType.length == 0) {
      outputType = undefined;
    }

    args = makeList(funcObject.arglist, 'arglist', 'variable');

    var argList = [];
    forEach(args, function(arg) {
      var newArg = {};
      argList.push(newArg);
      newArg.name = arg.identifier;
      newArg.type = arg.type;
    });

    var funcString = "function (";
    var first = true;
    var typeString = "";
    var typeCounter = 0;
    var envParams = "\n";
    forEach(argList, function(arg) {
      if(!first) {
        funcString += ", ";
      } else {
        first = false;
      }
      funcString += arg.name;
      envParams += "env = envAdd(env, '"+arg.name+"', "+arg.name+");\n";
      if (def(arg.type)) {
        typeString += "(" + arg.type + ") -> ";
      } else {
        typeString += "t" + typeCounter + " -> ";
        typeCounter++;
      }
    });
    var defineEval = "function evalExpr(s) {return evaluateExpr(s, env)};\n";
    funcString += ") { " + envParams + defineEval + JS + " }";
    if (def(outputType)) {
      if(outputTypeTransformer)
        outputType = outputTypeTransformer(outputType);
      typeString += "(" + outputType + ")";
    } else {
      typeString += "t" + typeCounter;
    }

    // environment will be passed to function, so JS code can access it as 'env' variable
    funcString = "function(env) {return " + funcString + ";}";

    return {
      kind: "lineJavascript",
      type: parseType(typeString),
      f: {
        kind: "jsFunction",
        func: funcString
      }
    };
  }

  function getLetKeyVal (node) {
    return {
      key: node.identifier,
      val: makeLine(node.line),
      debugRef: node.debugRef
    };
  }

  function getNewtypeKeyVal (node) {
    return {
      key: node.identifier,
      val: parseType(node.type),
      debugRef: node.debugRef
    };
  }

  function makeLineTemplate(node, isBlock) {
    var params = makeList(node.arglist, 'arglist', 'variable');
    var lets = makeListObject(node.fullletlist.letlist, 'letlist', 'let', getLetKeyVal);
    var newtypes = makeListObject(node.fullletlist.letlist, 'letlist', 'newtype', getNewtypeKeyVal);

    var output = node.fullletlist.line;
    //give undefined param types a letter
    var counter = 0;
    var paramList = [];
    var typeString = "";
    var first = true;

    forEach(params, function(param) {
      paramList.push(param.identifier);
      var type = param.type;
      if(type == undefined) {
        type = "t" + counter;
        counter++;
      }
      if (!first) {
        typeString += " -> ";
      } else {
        first = false;
      }
      typeString += "(" + type + ")";
    });
    if (!first) {
      typeString += " -> ";
    }
    if (isBlock) {
      if (def(node.fullletlist.line.expr) && def(node.fullletlist.line.expr.type)) {
        typeString += node.fullletlist.line.expr.type;
      } else {
        typeString = undefined;
      }
    } else if (def(node.type)) {
      typeString += node.type;
    } else if (def(output.type)) {
      typeString += output.type;
    } else {
      typeString += "XMLP";
    }

    var ret = {
      kind: "lineTemplate",
      params: paramList,
      let: lets,
      newtype: newtypes,
      output: makeLine(output),
      debugRef: node.debugRef
    };

    if (typeString !== undefined) {
      ret.type = parseType(typeString);
    }

    return ret;
  }

  function makeState(node) {
    var fullactlist;
    if (def(node.type)) {
      var createAction = {
        create:{
          type:node.type
        }
      };
      if(def(node.expr)) { //state(TYPE, EXPR) sugar
        var actlist = {
          actlist: {
            actline: {
              identifier:"x",
              action: createAction
            }
          },
          actline: {
            action: {
              expr: {
                exprcode: "set x " + node.expr.exprcode
              }
            }
          }
        };
        var action = {
          expr: {exprcode:"return x"}
        };
        fullactlist = {actlist:actlist, action:action, type: node.type};
      } else { //state(TYPE, {Prop:Expr...}) sugar
        if (def(node.proplist)) {
          createAction.create.proplist = node.proplist;
        }
        fullactlist = {actlist:{}, action:createAction, type: node.type};
      }
      addDebugRef(fullactlist, node.debugRef);
    }

    var lineTemplate = makeActionTemplate({arglist:{}, fullactlist:fullactlist, debugRef: node.debugRef, type:fullactlist.type});
    return {
      kind: "lineState",
      action: lineTemplate,
      debugRef: node.debugRef
    };
  }

  function makeXml (node) {

    function makeForeach (node) {
      var arglist;
      if (def(node.askeyval)) {
        arglist = makeAskeyval(node.askeyval);
      } else {
        arglist = {variable:{identifier:"_"}};
      }
      var wrappedTemplate = {
        arglist: arglist,
        fullletlist: node.fullletlist,
        debugRef: node.debugRef
      };

      var template = makeLineTemplate(wrappedTemplate);
      return {
        kind: "for-each",
        select: parse(node.expr.exprcode),
        lineTemplate: template,
        debugRef: node.debugRef
      };
    }

    function makeCall (node) {
      var wrappedTemplate = {
        arglist: {},
        fullletlist: node.fullletlist,
        debugRef: node.debugRef
      };

      var template = makeLineTemplate(wrappedTemplate);
      return {
        kind: "call",
        lineTemplate: template,
        debugRef: node.debugRef
      };
    }

    function makeOn (node) {
      var wrappedActiontpl = {
        arglist: {},
        fullactlist: node.fullactlist,
        debugRef: node.debugRef
      };

      var lineTemplate = makeActionTemplate(wrappedActiontpl);
      return {
        kind: "on",
        event: node.identifier,
        action: lineTemplate,
        debugRef: node.debugRef
      };
    }

    function makeInsert (node) {
      return {
        kind: "insert",
        expr: parse(node.expr.exprcode),
        debugRef: node.debugRef
      };
    }

    function makeTag (node) {
      var style = {};
      var attributeObject = {};
      function makeAttassign (node) {
        function makeAttribute (node) {
          if (def(node.string)) {
            return node.string;
          } else if (def(node.insert)) {
            return makeInsert(node.insert);
          }
        }

        if (def(node.stylelist)) {
          makeList(node.stylelist, 'stylelist', 'styleassign', function (node) {
            var attribute;
            if (def(node.styletext)) {
              attribute = node.styletext;
            } else if (def(node.insert)) {
              attribute = makeInsert(node.insert);
            }
            style[toCamelCase(node.styleattname)] = attribute;
          });
        } else if (def(node.attname) && def(node.attribute)) {
          var name = node.attname;
          if(name.indexOf("style-") == 0) {
            var styleAttName = name.substr(6);
            style[toCamelCase(styleAttName)] = makeAttribute(node.attribute);
          } else {
            attributeObject[name] = makeAttribute(node.attribute);
          }
        }
      }

      //this fills style and attributeObject as a side effect
      //this is very sloppy, TODO: make it more functional
      makeList(node.attributes, 'attributes', 'attassign', makeAttassign);

      function makeXmlFlattenTextNodes (node) {
        result = makeXml(node);
        if (arrayLike(result)) {
          return result;
        } else {
          return [result];
        }
      }

      var xmllist = makeListFlatten(node.xmllist, 'xmllist', 'xml', makeXmlFlattenTextNodes);

      return {
        kind: "element",
        nodeName: node.tagname,
        attributes: attributeObject,
        style: style,
        children: xmllist,
        debugRef: node.debugRef
      };
    }


    function makeTextNode (node) {
      var text = node.xmltext;

      function makeTextElement (nodeVal) {
        return {
          kind: "textElement",
          nodeValue: nodeVal,
          debugRef: node.debugRef
        };
      }

      //deal with inserts in textNodes
      var index = text.indexOf('{');
      var output = [];
      while(index !== -1) {
        var rindex = text.indexOf('}');
        var first = text.substr(0, index);
        var insert = text.substr(index+1, rindex-index-1);
        text = text.substr(rindex+1);
        if (first.length > 0) {
          output.push(makeTextElement(first));
        }
        output.push(makeTextElement(makeInsert({expr: {exprcode: insert}, debugRef: node.debugRef})));
        index = text.indexOf('{');
      }
      if (text.length > 0) {
        output.push(makeTextElement(text));
      }
      return output;
    }



    function makeXmlKind (name, node, parentNode) {
      switch(name){
        case 'foreach':
          return makeForeach(node);
        case 'on':
          return makeOn(node);
        case 'call':
          return makeCall(node);
        case 'tag':
          return makeTag(node);
        case 'xmltext':
          return makeTextNode(parentNode);
      }
    }
    var result;
    forEach(node, function(value, nodeName) {
      if (nodeName !== 'debugRef') {
        result = makeXmlKind(nodeName, value, node);
      }
    });
    return result;
  }

  function makeIncludeblock (node) {
    var lets = makeListObject(node.letlist, 'letlist', 'let', getLetKeyVal);
    var newtypes = makeListObject(node.letlist, 'letlist', 'newtype', getNewtypeKeyVal);
    if (def(node.let)) {
      var lastLet = getLetKeyVal(node.let);
      lets[lastLet.key] = lastLet.val;
    }
    if (def(node.newtype)) {
      var lastNewtype = getNewtypeKeyVal(node.newtype);
      newtypes[lastNewtype.key] = lastNewtype.val;
    }
    return {let: lets, newtype: newtypes};
  }


  function makeCreate (node) {
    var getKeyVal = function(node) {
      return {
        key: node.identifier,
        val: parse(node.expr.exprcode)
      };
    };
    var proplist = makeListObject(node.proplist, 'proplist', 'prop', getKeyVal);
    return {
      kind: "actionCreate",
      type: parseType(node.type),
      prop: proplist,
      debugRef: node.debugRef
    };
  }

  function makeExtract (node) {
    var wrappedActiontpl = {
      arglist: makeAskeyval(node.askeyval),
      fullactlist: node.fullactlist,
      debugRef: node.debugRef
    };

    var lineTemplate = makeActionTemplate(wrappedActiontpl);
    return {
      kind: "extract",
      select: parse(node.expr.exprcode),
      action: lineTemplate,
      debugRef: node.debugRef
    };
  }


  function makeLine (node) {
    var name, value;
    any(node, function(nodeValue, nodeName) {
      if (nodeName !== 'debugRef') {
        name = nodeName;
        value = nodeValue;
        return true;
      }
      return false;
    });

    switch (name) {
      case 'function':
        var lineFunc = makeFunction(value);
        lineFunc.debugRef = node.debugRef;
        return lineFunc;
      case 'jsaction':
        var lineFunc = makeFunction(value,
          function(JS) { return "return makeActionMethod( function() { "+JS+" } );"; },
          function(outputType) { return "Action ("+outputType+")"; }
        );
        lineFunc.debugRef = node.debugRef;
        return lineFunc;
      case 'template':
        return makeLineTemplate(value);
      case 'state':
        return makeState(value);
      case 'actiontpl':
        return makeActionTemplate(value);
      case 'lineAction':
        return value;
      case 'expr':
        value.exprcode = parse(value.exprcode);
        if(value.type !== undefined) {
          value.type = parseType(value.type);
        }
        return {kind: "lineExpr", expr: value.exprcode, type: value.type, debugRef: node.debugRef};
      case 'letlistblock':
        value.arglist = [];
        return makeLineTemplate(value, true);
      case 'ifblock':
        return {kind: "lineXML", xml:makeIfblock(value), debugRef: value.debugRef};
      case 'ifaction':
        return makeIfaction(value);
      case 'xml':
        return {kind:'lineXML', xml:makeXml(value)};
      case 'create':
        return makeCreate(value);
      case 'extract':
        return makeExtract(value);
    }
  }

  // ====================================================
  // PreProcessing Functions (whitespace, line counting)
  // ====================================================

  function preProcessTree(tree) {
    function lineBreakCount(str){
      /* counts \n */
      var match = str.match(/\n/gi);
      if (match !== null) {
        return match.length;
      } else {
        return 0;
      }
    }

    function stripSpaces(string) {
      string = string.replace(/\/\/[^\n]*\n/g, "");
      return string.replace(/^\s+|\s+$/g,"");
    }

    var lineNum = 1;

    function handleWhiteSpace(tree) {
      var startLine = lineNum;
      forEach(tree, function(value, nodeName) {
        function startsWith (string) {
          return nodeName.indexOf(string) == 0;
        }

        if(objectLike(value)) {
          handleWhiteSpace(value);
        } else {
          lineNum += lineBreakCount(value);
          if (nodeName === "string") {
            value = value.replace(/\"/g, "");
            value = value.replace(/\n/g, "\\n");
          }
          tree[nodeName] = stripSpaces(value);
        }
      });
      tree.debugRef = {lineNumber: startLine, file: filename};
    }

    handleWhiteSpace(tree);
  }

  return {
    processTree: function(tree, inFilename) {
      filename = inFilename;
      preProcessTree(tree);
      if (def(tree.line)) { //tpl files have top level Line
        var ret = makeLine(tree.line);
        return ret;
      } else if (def(tree.includeblock)) { //let files have top level includeblock
        var ret = makeIncludeblock(tree.includeblock);
        return ret;
      }
    }
  };
}();