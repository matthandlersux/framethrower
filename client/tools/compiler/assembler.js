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


function compileFolder(folderPath, rebuild) {
	var folder = "../../source/templates/" + folderPath;
	var folderName;
	var slashIndex = folder.lastIndexOf("/");
	if (slashIndex !== -1) {
		folderName = folder.substr(slashIndex+1);
	} else {
		folderName = folder;
	}
	
	var binfolder = "../../generated/templates/" + folderPath;
	
	makeDirectory(binfolder);
	
	var childFiles = listFiles(folder);
	var childDirectories = listDirectories(folder);
		
	var lets = {};
	var mainJSON;
	forEach(childFiles, function(child) {
		var nameWithExt = child;
		var name = nameWithExt.substr(0, nameWithExt.length - 4);
		var ext = nameWithExt.substr(nameWithExt.length - 3);
		if (ext === "tpl") {
			if(name == folderName) {
				mainJSON = compileFile(folderPath + "/" + child, rebuild, false);
			} else {
				var let = compileFile(folderPath + "/" + child, rebuild, false);
				if (let !== undefined) {
					lets[name] = let;
				}
			}
		} else if (ext === "let") {
			var includeLets = compileFile(folderPath + "/" + child, rebuild, true);
			if (includeLets !== undefined) {
				mergeIntoObject(lets, includeLets);
			}
		}
	});
	forEach(childDirectories, function(child) {
		var let = compileFolder(folderPath + "/" + child, rebuild);
		if (let !== undefined) {
			lets[child] = let;
		}
	});
	if (mainJSON.let === undefined) mainJSON.let = {};
	mergeIntoObject(mainJSON.let, lets);
	return mainJSON;
}

function log () {
	try {
		console.log.apply(undefined, arguments);
	} catch (e) {
		print.apply(undefined, arguments);
	}
}

function compileFile (filePath, rebuild, isLetFile) {
	var file = "../../source/templates/" + filePath;
	var binfile = "../../generated/templates/" + filePath + ".ser";


//TODO add functions for lastModified to shell c++
	if (false) {
	// if (!rebuild && binfile && binfile.exists() && (binfile.lastModified() > file.lastModified())) {
	// 	return deserialize(binfile.getAbsolutePath());
	} else {
		var str;
		try {
			str = read(file);
		} catch (e) {
			str = loadTextNow("../../source/templates/" + filePath);
			console.log("Str: " + str);
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
			log("<b>Parse errors, File: " + file + "</b><br />");
			for( i = 0; i < error_cnt; i++ ) {
				var lineInfo = countLines(str, error_off[i]);
				var escapedLine= lineInfo.line.split("&").join("&amp;").split( "<").join("&lt;").split(">").join("&gt;")				
				log("<div style=\"margin-left:15px;font:8px\"><a href=\"txmt://open/?url=file://" + file + "&line=" + lineInfo.lines + "&column=" + lineInfo.column + "\">error on line", lineInfo.lines + ", column:", lineInfo.columnWithTabs, "</a> <br />expecting \"" + error_la[i].join() + "\" <br />near:", "\n" + escapedLine + "</div><br />");
			}
			throw("Parse Error");
		} else {
			var filePath;
			if (file) {
				//TODO add getCanonicalPath to shell c++
				// filePath = file.getCanonicalPath();
				filePath = file;
			}
			result = semantics.processTree(parseResult.result, "" + filePath);
			try {
				//TODO: add serialize to shell c++
				serialize(result, binfile);
			} catch (e) {}
			return result;
		}
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
//RUN COMMAND: rhino assembler.js <root folder>
//java -jar ../util/js.jar -opt -1 assembler.js <root folder> rebuild

try{
	if( arguments.length > 0 ) { 		
		var rebuild = false;
		if (arguments[1] == "rebuild") {
			rebuild = true;
		}
	
		//create bin folder if it doesn't exist
		var binfolder1 = "../../generated";
		var binfolder = "../../generated/templates";
		
		makeDirectory(binfolder1);
		makeDirectory(binfolder);

		var totalCompiledJSON = compileFolder(arguments[0], rebuild);
		if(!GLOBAL_ERRORS) {
			desugarFetch(totalCompiledJSON);
			var totalCompiledString = "var mainTemplate = " + outputJSON(totalCompiledJSON, 0) + ";";
			
			write("../../generated/templates/" + arguments[0] + ".js", totalCompiledString);
			var result = typeAnalyze(totalCompiledJSON);
			if (result.success) {
				console.log('success');
			}
		}
	} else {
		log( 'usage: rhino assembler.js <root folder> [rebuild]' );
	}
} catch (e) {}