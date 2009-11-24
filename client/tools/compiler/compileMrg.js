var GLOBAL_ERRORS = false;

ROOTDIR = "../../";
function include (bundles, extraFiles) {
	try {
		load(ROOTDIR + "source/js/include.js");
		includes.rhinoInclude(bundles, extraFiles);
	} catch (e) {}
}

function getFileName(filePath) {
	var slashIndex = filePath.lastIndexOf("/");
	if (slashIndex !== -1) {
		filePath = filePath.substr(slashIndex+1);
	} else {
		filePath = filePath;
	}
	
	var dotIndex = filePath.lastIndexOf(".");
	if (dotIndex !== -1) {
		return filePath.substr(0, dotIndex);
	} else {
		return filePath;
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



function compileFile (filePath, isLetFile) {
	var str;
	try {
		str = read(filePath);
	} catch (e) {
		console.log("error reading file: " + filePath);
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
//./shell compileMrg.js <file>

try{
	if( arguments.length > 1 ) { 		
		//includes loads in mainTemplate for type checking
		var mainTemplateFile = "../../generated/templates/" + arguments[1] + ".js";
		include(["core"], ["tplparser.js", "semantics.js", "../typeAnalyzer/typeAnalyzer.js", mainTemplateFile]);
	
		//create bin folder if it doesn't exist
		var binfolder1 = ROOTDIR + "../server/pipeline/priv/";
		var binfolder = ROOTDIR + "../server/pipeline/priv/" + arguments[1];
		
		
		makeDirectory(binfolder1);
		makeDirectory(binfolder);

		var fileName = getFileName(arguments[0]);
		
		var totalCompiledJSON = compileFile(arguments[0]);
		
		if(!GLOBAL_ERRORS) {
			desugarFetch(totalCompiledJSON);
			write(binfolder + "/" + fileName, JSON.stringify(totalCompiledJSON));
			
			mainTemplate.let['mrg'] = totalCompiledJSON;
			
			var result = typeAnalyze(mainTemplate);
			if (result.success) {
				console.log('success');
			}
		}
	} else {
		console.log( 'usage: ./shell compileMrg.js <file> <templateFolderName>' );
	}
} catch (e) {
	console.log(e.stack);
}