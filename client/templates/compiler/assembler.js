//load is rhino command. When running in browser, have to load the file with <script> tag
if (load !== undefined) {
	load(["tplparser.js"]);
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
					output += name + ": " + JSONtoString(value, tabs+1);
				});
				output += "\n";
				for (var i=0; i<=tabs-1; i++) {
					output += "\t";
				}			
				output += "}";
				return output;
			}
		} else if (typeOf(object) === "string"){
			return "\"" + object + "\"";
		} else {
			return object;
		}
	}
}


function addLets(Json, lets) {
	if(Json !== undefined) {
		forEach(lets, function(let, name) {
			Json.let[name] = let;
		});
	}
}

function compileFolder(folder) {
	var children = folder.listFiles();
	var lets = {};
	var mainJSON;
	if (children !== null) { 
		forEach(children, function(child) {
			if (child.isDirectory()) {
				var let = compileFolder(child);
				if (let !== undefined) {
					lets[child.getName()] = let;
				}
			} else {
				var nameWithExt = child.getName();
				var name = nameWithExt.substr(0, nameWithExt.length() - 4);
				if(name == (folder.getName())) {
					mainJSON = compileFile(child);
				} else {
					var let = compileFile(child);
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

function compileFile (file) {
	var str = readFile(file.getAbsolutePath()); 
	var error_cnt = 0; 
	var error_off = new Array(); 
	var error_la = new Array(); 
	if( ( error_cnt = __parse( str, error_off, error_la ) ) > 0 ) { 
		for( i = 0; i < error_cnt; i++ ) {
			print( "Parse error near \"" + str.substr( error_off[i], 10 ) + ( ( str.length > error_off[i] + 10 ) ? "..." : "" ) + "\", expecting \"" + error_la[i].join() + "\"" ); 
		} 
	} else {
		print('success');
		//result is a global variable that holds the result from parsing
		var answer = result;
		result = undefined;
		return answer;
	}
}

//MAIN
//COMPILE COMMAND: rhino jscc.js -o tplparser.js fttemplate.par
//java -jar js.jar jscc.js -o tplparser.js fttemplate.par
//RUN COMMAND: rhino assembler.js <root folder>
//java -jar js.jar assembler.js <root folder>

if( arguments.length > 0 ) { 
	var rootFolder = java.io.File("../" + arguments[0]);
	var totalCompiledJSON = compileFolder(rootFolder);
	var totalCompiledString = "var mainTemplate = " + JSONtoString(totalCompiledJSON, 0);

	var fw = new java.io.FileWriter("../bin/" + arguments[0] + ".js");
	var bw = new java.io.BufferedWriter(fw);
		
	bw.write(totalCompiledString);
	bw.close();
} else {
	print( 'usage: rhino assembler.js <root folder>' );
}