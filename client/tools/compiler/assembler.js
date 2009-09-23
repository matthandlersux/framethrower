var GLOBAL_ERRORS = false;

//load is rhino command. When running in browser, have to load the file with <script> tag
if (load !== undefined) {
	load(["tplparser.js"]);
	load(["semantics.js"]);
}

function outputJSON(object, tabs) {
	if(object !== undefined) {
		if(arrayLike(object)) {
			var output = "[\n";
			var first = true;
			forEach(object, function (value) {
				if (!first) {
					output += ",\n";
				} else {
					first = false;
				}
				for (var i=0; i<=tabs; i++) {
					output += "\t";
				}
				output += outputJSON(value, tabs+1);
			});
			output += "\n";
			for (var i=0; i<=tabs-1; i++) {
				output += "\t";
			}			
			output += "]";
			return output;			
		} else if (objectLike(object)) {
			if(object.kind == "jsFunction") {
				return object.func;
			} else {
				var output = "{\n";
				var first = true;
				forEach(object, function (value, name) {
					if (!first) {
						output += ",\n";
					} else {
						first = false;
					}
					for (var i=0; i<=tabs; i++) {
						output += "\t";
					}
					output += "'" + name + "'" + ": " + outputJSON(value, tabs+1);
				});
				output += "\n";
				for (var i=0; i<=tabs-1; i++) {
					output += "\t";
				}			
				output += "}";
				return output;
			}
		} else if (typeOf(object) === "string"){
			return "\"" + object.replace(/\n/g, "\\n") + "\"";
		} else {
			return object;
		}
	}
}


function mergeIntoObject(sink, source) {
	forEach(source, function(line, name) {
		sink[name] = line;
	});
}


function compileFolder(folderPath, rebuild) {
	var folder = java.io.File("../../source/templates/" + folderPath);
	var binfolder = java.io.File("../../generated/templates/" + folderPath);
	if(!binfolder.exists()) {
		binfolder.mkdir();
	}
	
	var children = folder.listFiles();
	var lets = {};
	var sharedLets = {};
	var mainJSON;
	if (children !== null) { 
		forEach(children, function(child) {
			if (child.isDirectory()) {
				var let = compileFolder(folderPath + "/" + child.getName(), rebuild);
				if (let !== undefined) {
					lets[child.getName()] = let;
				}
			} else {
				var nameWithExt = child.getName();
				var name = nameWithExt.substr(0, nameWithExt.length() - 4);
				var ext = nameWithExt.substr(nameWithExt.length() - 3);
				if (ext === "tpl") {
					if(name == (folder.getName())) {
						mainJSON = compileFile(folderPath + "/" + child.getName(), rebuild, false);
					} else {
						var let = compileFile(folderPath + "/" + child.getName(), rebuild, false);
						if (let !== undefined) {
							lets[name] = let;
						}
					}
				} else if (ext === "let") {
					var includeLets = compileFile(folderPath + "/" + child.getName(), rebuild, true);
					if (includeLets !== undefined) {
						mergeIntoObject(lets, includeLets);
					}
				} else if (ext === "shr") {
					var includeLets = compileFile(folderPath + "/" + child.getName(), rebuild, true);
					if (includeLets !== undefined) {
						mergeIntoObject(sharedLets, includeLets);
					}
				}
				
			}
		});
	}
	if (mainJSON.let === undefined) mainJSON.let = {};
	mergeIntoObject(mainJSON.let, lets);
	if (mainJSON.sharedLet === undefined) mainJSON.sharedLet = {};
	mergeIntoObject(mainJSON.sharedLet, sharedLets);
	return mainJSON;
}


function compileFile (filePath, rebuild, isLetFile) {
	var file = java.io.File("../../source/templates/" + filePath);
	var binfile = java.io.File("../../generated/templates/" + filePath + ".ser");
	if (!rebuild && binfile.exists() && (binfile.lastModified() > file.lastModified())) {
		return deserialize(binfile.getAbsolutePath());
	} else {
		var str = readFile(file.getAbsolutePath());
		if (isLetFile) {
			str = "includefile " + str;
		}
		str = removeComments(str);
		var error_cnt = 0; 
		var error_off = new Array(); 
		var error_la = new Array();
		var parseResult = fttemplate.parse( str, error_off, error_la );
		if( !parseResult.success ) {
			error_cnt = parseResult.result;
			GLOBAL_ERRORS = true;
			print("<b>Parse errors, File: " + file.getName() + "</b><br />");
			for( i = 0; i < error_cnt; i++ ) {
				var lineInfo = countLines(str, error_off[i]);
				var escapedLine= lineInfo.line.split("&").join("&amp;").split( "<").join("&lt;").split(">").join("&gt;")				
				print("<div style=\"margin-left:15px;font:8px\"><a href=\"txmt://open/?url=file://" + file.getCanonicalPath() + "&line=" + lineInfo.lines + "&column=" + lineInfo.column + "\">error on line", lineInfo.lines + ", column:", lineInfo.columnWithTabs, "</a> <br />expecting \"" + error_la[i].join() + "\" <br />near:", "\n" + escapedLine + "</div><br />");
			}
		} else {
			result = semantics.processTree(parseResult.result, "" + file.getCanonicalPath());
			serialize(result, binfile.getAbsolutePath());
			return result;
		}
	}
}


function removeComments (str) {
	var literalStrings;
	
function replaceLiteralStrings(s) {
    var i, c, t, lines, escaped, quoteChar, inQuote, inComment, literal;
    literalStrings = new Array();
    t = "";
    j = 0;
    inQuote = false;
	inComment = false;
    while (j <= s.length) {
        c = s.charAt(j);

        // If not already in a string, look for the start of one.
        if (!inQuote && !inComment) {
            if (c == '/' && s.charAt(j + 1) == '/') {
                inComment = true;
				t += c;
            } else if (c == '"' || c == "'") {
                inQuote = true;
                escaped = false;
                quoteChar = c;
                literal = c;
            }
            else
            t += c;
        }

        // Already in a string, look for end and copy characters.
        else if (inQuote) {
			if (c == quoteChar && !escaped) {
				inQuote = false;
				literal += quoteChar;
				t += "__" + literalStrings.length + "__";
				literalStrings[literalStrings.length] = literal;
			} else if (c == "\\" && !escaped) {
				escaped = true;
			} else {
		      escaped = false;
			}
		    literal += c;
		} else if (inComment) {
			if (c == '\n') {
				inComment = false;
			}
			t += c;
		}
		j++;
	}
	return t;
}
	
	
	function restoreLiteralStrings(s) {

	  var i;

	  for (i = 0; i < literalStrings.length; i++)
	    s = s.replace(new RegExp("__" + i + "__"), literalStrings[i]);

	  return s;
	}
	
	str = replaceLiteralStrings(str);
	str = str.replace(/([^\x2f^\n]*)\x2f\x2f[^\n]*\n/g, "$1\n");
	str = restoreLiteralStrings(str);
	return str;
}

function countLines (wholeString, position) {
	var column;
	var columnWithTabs;
	var line;
	function countHelper(string, startIndex) {
		var index = string.indexOf('\n');
		if (index !== -1) {
			return 1 + countHelper(string.substr(index+1), startIndex + index + 1)
		} else {
			var rest = wholeString.substr(startIndex);
			line = rest.substr(0, rest.indexOf("\n"));
			column = string.length + 1;
			var withTabs = string.replace(/\t/g, "    ");
			columnWithTabs = withTabs.length + 1;
			
			var min = column - 30;
			var filler = "";
			if (min < 0) {
				line = line.substr(0, 60 + min);
				for (var i = 0; i < -min; i++) {
					filler += " ";
				}
			} else {
				line = line.substr(min, 60);
			}
			line = filler + line;
			return 0;
		}
	}
	return {
		lines: 1 + countHelper(wholeString.substr(0, position), 0),
		line: line,
		column: column,
		columnWithTabs: columnWithTabs
	};
}


//MAIN
//COMPILE COMMAND: rhino jscc.js -o tplparser.js fttemplate.par
//java -jar ../util/js.jar jscc.js -o tplparser.js fttemplate.par
//RUN COMMAND: rhino assembler.js <root folder>
//java -jar ../util/js.jar -opt -1 assembler.js <root folder> rebuild

if( arguments.length > 0 ) { 
	var rebuild = false;
	if (arguments[1] == "rebuild") {
		rebuild = true;
	}
	
	//create bin folder if it doesn't exist
	var binfolder1 = java.io.File("../../generated");
	var binfolder = java.io.File("../../generated/templates");
	if(!binfolder1.exists()) {
		binfolder1.mkdir();
	}
	if(!binfolder.exists()) {
		binfolder.mkdir();
	}
	
	var totalCompiledJSON = compileFolder(arguments[0], rebuild);
	if(!GLOBAL_ERRORS) {
		var totalCompiledString = "var mainTemplate = " + outputJSON(totalCompiledJSON, 0) + ";";

		var fw = new java.io.FileWriter("../../generated/templates/" + arguments[0] + ".js");
		var bw = new java.io.BufferedWriter(fw);

		bw.write(totalCompiledString);
		bw.close();
		
		
		load("../typeAnalyzer/runTypeAnalyzer.js");
		load("../../generated/templates/" + arguments[0] + ".js");
		runTypeAnalyzer(mainTemplate);
	}
} else {
	print( 'usage: rhino assembler.js <root folder> [rebuild]' );
}