var GLOBAL_ERRORS = false;

//load is rhino command. When running in browser, have to load the file with script tag
ROOTDIR = "../../";
function include (bundles, extraFiles) {
	try {
		load(ROOTDIR + "source/js/include.js");
		includes.rhinoInclude(bundles, extraFiles);
	} catch (e) {}
}
include(["core"], ["tplparser.js", "semantics.js", "../typeAnalyzer/typeAnalyzer.js"]);

function loadTextNow(url) {
	try {
		var req = new XMLHttpRequest();
		req.open("GET", url, false);
		req.send(null);
	} catch (e) {
		console.log("loadXMLNow failed: " + url);
	}
	return req.responseText;
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
			object = object.replace(/\\/g, "\\\\");
			object = object.replace(/\n/g, "\\n");
			object = object.replace(/\"/g, "\\\"");
			return "\"" + object + "\"";
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

function getFolderName(folderPath) {
	var slashIndex = folderPath.lastIndexOf("/");
	if (slashIndex !== -1) {
		return folderPath.substr(slashIndex+1);
	} else {
		return folderPath;
	}	
}


function compileShared(folderPath) {
	var folder = "../../source/templates/" + folderPath;
	var folderName = getFolderName(folderPath);
	
	//process <template name>.shr file
	var sharedJSON = compileFile(folderPath + "/shared/" + folderName + ".shr", true);
	//process <template name>.mrg file
	sharedJSON.initMrg = compileFile(folderPath + "/shared/" + folderName + ".mrg", false);
	
	return sharedJSON;
}

	

function compileFolder(folderPath) {
	var folder = "../../source/templates/" + folderPath;
	var folderName = getFolderName(folderPath);
	
	var childFiles = listFiles(folder);
	var childDirectories = listDirectories(folder);
		
	var mainJSON = {let: {}, newtype: {}};
	forEach(childFiles, function(child) {
		var nameWithExt = child;
		var name = nameWithExt.substr(0, nameWithExt.length - 4);
		var ext = nameWithExt.substr(nameWithExt.length - 3);
		if (ext === "tpl") {
			if(name == folderName) {
				mainJSON = compileFile(folderPath + "/" + child, false);
			} else {
				var let = compileFile(folderPath + "/" + child, false);
				if (let !== undefined) {
					mainJSON.let[name] = let;
				}
			}
		} else if (ext === "let") {
			var includeLets = compileFile(folderPath + "/" + child, true);
			if (includeLets !== undefined) {
				if(includeLets.let !== undefined )
					mergeIntoObject(mainJSON.let, includeLets.let);
				if(includeLets.newtype !== undefined )
					mergeIntoObject(mainJSON.newtype, includeLets.newtype);
			}
		}
	});
	forEach(childDirectories, function(child) {
		if (child === "css" || child === "shared") {
			//ignore css folder and shared folder
		} else {
			var let = compileFolder(folderPath + "/" + child);
			if (let !== undefined) {
				mainJSON.let[child] = let;
			}
		}
	});
	return mainJSON;
}

function compileFile (filePath, isLetFile) {
	var file = "../../source/templates/" + filePath;

	var str;
	try {
		str = read(file);
	} catch (e) {
		str = loadTextNow("../../source/templates/" + filePath);
		console.log("loadTextNow: " + str);
	}
			
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
		console.log("<b>Parse errors, File: " + file + "</b><br />");
		for( i = 0; i < error_cnt; i++ ) {
			var lineInfo = countLines(str, error_off[i]);
			var escapedLine= lineInfo.line.split("&").join("&amp;").split( "<").join("&lt;").split(">").join("&gt;")				
			console.log("<div style=\"margin-left:15px;font:8px\"><a href=\"txmt://open/?url=file://" + getCanonicalPath(file) + "&line=" + lineInfo.lines + "&column=" + lineInfo.column + "\">error on line", lineInfo.lines + ", column:", lineInfo.columnWithTabs, "</a> <br />expecting \"" + error_la[i].join() + "\" <br />near:", "\n" + escapedLine + "</div><br />");
		}
		throw("Parse Error");
	} else {
		var filePath;
		filePath = getCanonicalPath(file);
		return semantics.processTree(parseResult.result, "" + filePath);
	}
}


function removeComments (s) {
    var c, t, escaped, quoteChar, inQuote, inComment;
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
            } else if (c == '"' || c == "'") {
                inQuote = true;
                escaped = false;
                quoteChar = c;
				t += c;
            }
            else
            t += c;
        }

        // Already in a string, look for end and copy characters.
        else if (inQuote) {
			if (c == quoteChar && !escaped) {
				inQuote = false;
			} else if (c == "\\" && !escaped) {
				escaped = true;
			} else {
		      escaped = false;
			}
			t += c;
		} else if (inComment) {
			if (c == '\n') {
				inComment = false;
				t += c;
			}
		}
		j++;
	}
	return t;
}

function countLines (wholeString, position) {
	var column;
	var columnWithTabs;
	var line;
	function countHelper(string, startIndex) {
		var index = string.indexOf('\n');
		if (index !== -1) {
			return 1 + countHelper(string.substr(index+1), startIndex + index + 1);
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
//RUN COMMAND:
//./shell assembler.js <root folder>

try{
	if( arguments.length > 0 ) { 		
	
		//create bin folder if it doesn't exist
		var binfolder1 = "../../generated";
		var binfolder = "../../generated/templates";
		
		makeDirectory(binfolder1);
		makeDirectory(binfolder);

		var sharedCompiledJSON = compileShared(arguments[0]);
		var totalCompiledJSON = compileFolder(arguments[0]);
		totalCompiledJSON.sharedLet = sharedCompiledJSON.let;
		totalCompiledJSON.initMrg = sharedCompiledJSON.initMrg;
		mergeIntoObject(totalCompiledJSON.newtype, sharedCompiledJSON.newtype);
		if(!GLOBAL_ERRORS) {
			desugarNewtype(totalCompiledJSON);
			desugarFetch(totalCompiledJSON);
			var totalCompiledString = "var mainTemplate = " + outputJSON(totalCompiledJSON, 0) + ";";
			
			write("../../generated/templates/" + arguments[0] + ".js", totalCompiledString);
			var result = typeAnalyze(totalCompiledJSON);
			if (result.success) {
				console.log('success');
			}
		}
	} else {
		console.log( 'usage: rhino assembler.js <root folder>' );
	}
} catch (e) {
	console.log(e.stack);
}