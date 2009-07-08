//RHINO util functions

//create folders if they don't exist
function makeFolder (folderName) {
	var binfolder = java.io.File(folderName);
	if(!binfolder.exists()) {
		binfolder.mkdir();
	}	
}

function writeStringToFile(filename, string) {
	var fw = new java.io.FileWriter(filename);
	var bw = new java.io.BufferedWriter(fw);
	bw.write(string);
	bw.close();
}