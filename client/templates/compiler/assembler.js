var GLOBAL_ERRORS = false;

//load is rhino command. When running in browser, have to load the file with <script> tag
if (load !== undefined) {
	load(["tplparser.js"]);
	load(["preparse.js"]);
}

function JSONtoString(object, tabs) {
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
				output += JSONtoString(value, tabs+1);
			});
			output += "\n";
			for (var i=0; i<=tabs-1; i++) {
				output += "\t";
			}			
			output += "]";
			return output;			
		} else if (objectLike(object)) {
			if(object.kind !== undefined && object.kind == "jsFunction") {
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
					output += "'" + name + "'" + ": " + JSONtoString(value, tabs+1);
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


function addLets(Json, lets) {
	if(Json !== undefined) {
		forEach(lets, function(line, name) {
			Json.template.let[name] = line;
		});
	}
}


function compileFolder(folderPath, rebuild) {
	var folder = java.io.File("../" + folderPath);
	var binfolder = java.io.File("../bin/" + folderPath);
	if(!binfolder.exists()) {
		binfolder.mkdir();
	}
	
	var children = folder.listFiles();
	var lets = {};
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
				if(name == (folder.getName())) {
					mainJSON = compileFile(folderPath + "/" + child.getName(), rebuild);
				} else {
					var let = compileFile(folderPath + "/" + child.getName(), rebuild);
					if (let !== undefined) {
						lets[name] = let;
					}
				}
			}
		});
	}
	addLets(mainJSON, lets);
	return mainJSON;
}


function preParse(string) {
	//textnodes	
	string = preParser.parse(string);
	
	string = string.replace(/\t/g, "    ");
	string = string.replace(/\/\/[^\n]*\n/g, "");
	string = string.replace(/\/\*[^\*\/]*\*\//g, "");
	// string = string.replace(/(<(f[^:^\/^>]|[^f^\/^>])[^<^>^\/]*>)([^<^>]*[^<^>^ ^\r^\t^\n][^<^>]*)/g, "$1<p:textnode>$3</p:textnode>");
	// string = string.replace(/(<\/[^<^>]+>)(([^<^>^\{^\}]|\{[^\}]*\})*([^<^>^\{^\}^ ^\r^\t^\n]|\{[^\}]*\})([^<^>^\{^\}]|\{[^\}]*\})*)/g, "$1<p:textnode>$2</p:textnode>");

	return string;
}


function compileFile (filePath, rebuild) {
	var file = java.io.File("../" + filePath);
	var binfile = java.io.File("../bin/" + filePath + ".ser");
	
	if (!rebuild && binfile.exists() && (binfile.lastModified() > file.lastModified())) {
		return deserialize(binfile.getAbsolutePath());
	} else {
		GLOBAL_ERRORS = true;
		var str = readFile(file.getAbsolutePath());
		var error_cnt = 0; 
		var error_off = new Array(); 
		var error_la = new Array(); 
		str = preParse(str);
		if( ( error_cnt = __parse( str, error_off, error_la ) ) > 0 ) { 
			print("Parse errors, File: " + file.getName());
			for( i = 0; i < error_cnt; i++ ) {
				var lineInfo = countLines(str, error_off[i]);
				print("    error on line", lineInfo.lines + ", column:", lineInfo.column, "expecting \"" + error_la[i].join() + "\" near:", "\n" + lineInfo.line + "\n                              ^\n");
			}
		} else {
			//result is a global variable that holds the result from parsing
			var answer = result;
			result = undefined;
			serialize(answer, binfile.getAbsolutePath());
			return answer;
		}
	}
}


function countLines(wholeString, position) {
	var column;
	var line;
	function countHelper(string, startIndex) {
		var index = string.indexOf('\n');
		if (index !== -1) {
			return 1 + countHelper(string.substr(index+1), startIndex + index + 1)
		} else {
			var rest = wholeString.substr(startIndex);
			line = rest.substr(0, rest.indexOf("\n"));
			column = string.length;
			
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
		column: column
	};
}


//MAIN
//COMPILE COMMAND: rhino jscc.js -o tplparser.js fttemplate.par
//java -jar js.jar jscc.js -o tplparser.js fttemplate.par
//RUN COMMAND: rhino assembler.js <root folder>
//java -jar js.jar -opt -1 assembler.js <root folder> rebuild

if( arguments.length > 0 ) { 
	var rebuild = false;
	if (arguments[1] == "rebuild") {
		rebuild = true;
	}
	
	var totalCompiledJSON = compileFolder(arguments[0], rebuild);
	if(!GLOBAL_ERRORS) {
		var totalCompiledString = "var mainTemplate = " + JSONtoString(totalCompiledJSON, 0) + ";";

		var fw = new java.io.FileWriter("../bin/" + arguments[0] + ".js");
		var bw = new java.io.BufferedWriter(fw);

		bw.write(totalCompiledString);
		bw.close();
		print('success');		
	}
} else {
	print( 'usage: rhino assembler.js <root folder> [rebuild]' );
}