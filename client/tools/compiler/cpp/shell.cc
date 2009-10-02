// HOW TO COMPILE on Andrew's Computer:
// g++ -I/Users/andrewdailey/Documents/work/cpp/v8/include  -I/Users/andrewdailey/Documents/work/cpp/boost_1_40_0 cpp/shell.cc -o shell /Users/andrewdailey/Documents/work/cpp/v8/libv8.a /Users/andrewdailey/Documents/work/cpp/boost_1_40_0/lib/libboost_system.a /Users/andrewdailey/Documents/work/cpp/boost_1_40_0/lib/libboost_filesystem.a -lpthread -mmacosx-version-min=10.4 -m32




// Copyright 2009 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#include <v8.h>
#include <fcntl.h>
#include <string>
#include <stdio.h>
#include <stdlib.h>

#include <dirent.h>
#include <boost/filesystem.hpp>

using namespace std;

void RunShell(v8::Handle<v8::Context> context);
bool ExecuteString(v8::Handle<v8::String> source,
                   v8::Handle<v8::Value> name,
                   bool print_result,
                   bool report_exceptions);
v8::Handle<v8::Value> Print(const v8::Arguments& args);
v8::Handle<v8::Value> Read(const v8::Arguments& args);
v8::Handle<v8::Value> Write(const v8::Arguments& args);
v8::Handle<v8::Value> Load(const v8::Arguments& args);
v8::Handle<v8::Value> Quit(const v8::Arguments& args);
v8::Handle<v8::Value> Version(const v8::Arguments& args);
v8::Handle<v8::String> ReadFile(const char* name);
v8::Handle<v8::Value> ListFiles(const v8::Arguments& args);
v8::Handle<v8::Value> ListDirectories(const v8::Arguments& args);
v8::Handle<v8::Value> MakeDirectory(const v8::Arguments& args);
v8::Handle<v8::Value> ListItems(const char* name, int type);
void ReportException(v8::TryCatch* handler);


int RunMain(int argc, char* argv[]) {
  v8::V8::SetFlagsFromCommandLine(&argc, argv, true);
  v8::HandleScope handle_scope;
  // Create a template for the global object.
  v8::Handle<v8::ObjectTemplate> global = v8::ObjectTemplate::New();
  // Bind the global 'print' function to the C++ Print callback.
  global->Set(v8::String::New("print"), v8::FunctionTemplate::New(Print));
  // Bind the global 'read' function to the C++ Read callback.
  global->Set(v8::String::New("read"), v8::FunctionTemplate::New(Read));
  // Bind the global 'write' function to the C++ Write callback.
  global->Set(v8::String::New("write"), v8::FunctionTemplate::New(Write));

  // Bind the global 'listFiles' function to the C++ ListFiles callback.
  global->Set(v8::String::New("listFiles"), v8::FunctionTemplate::New(ListFiles));
  // Bind the global 'listDirectories' function to the C++ ListDirectories callback.
  global->Set(v8::String::New("listDirectories"), v8::FunctionTemplate::New(ListDirectories));
  // Bind the global 'makeDirectory' function to the C++ MakeDirectory callback.
  global->Set(v8::String::New("makeDirectory"), v8::FunctionTemplate::New(MakeDirectory));

  // Bind the global 'load' function to the C++ Load callback.
  global->Set(v8::String::New("load"), v8::FunctionTemplate::New(Load));
  // Bind the 'quit' function
  global->Set(v8::String::New("quit"), v8::FunctionTemplate::New(Quit));
  // Bind the 'version' function
  global->Set(v8::String::New("version"), v8::FunctionTemplate::New(Version));
  // Create a new execution environment containing the built-in
  // functions
  v8::Handle<v8::Context> context = v8::Context::New(NULL, global);
  // Enter the newly created execution environment.
  v8::Context::Scope context_scope(context);
  const char* fileName;
  bool first = true;
  bool firstArg = true;
  string arguments("");

  bool run_shell = (argc == 1);
  for (int i = 1; i < argc; i++) {
    const char* str = argv[i];
    if (strcmp(str, "--shell") == 0) {
      run_shell = true;
    } else if (strcmp(str, "-f") == 0) {
      // Ignore any -f flags for compatibility with the other stand-
      // alone JavaScript engines.
      continue;
    } else if (strncmp(str, "--", 2) == 0) {
      printf("Warning: unknown flag %s.\nTry --help for options\n", str);
    } else if (strcmp(str, "-e") == 0 && i + 1 < argc) {
      // Execute argument given to -e option directly
      v8::HandleScope handle_scope;
      v8::Handle<v8::String> file_name = v8::String::New("unnamed");
      v8::Handle<v8::String> source = v8::String::New(argv[i + 1]);
      if (!ExecuteString(source, file_name, false, true))
        return 1;
      i++;
    } else {
      // Use all other arguments as names of files to load and run.
	  if (first) {
		fileName = str;
		first = false;
	  } else {
		if (firstArg) {
			arguments = arguments + "\"" + str + "\"";
			firstArg = false;
		} else {
			arguments = arguments + ", \"" + str + "\"";
		}
	  }
    }
  }

  //run fileName
  v8::HandleScope handle_scope2;
  v8::Handle<v8::String> source = ReadFile(fileName);
  v8::Handle<v8::String> file_name = v8::String::New(fileName);
  if (source.IsEmpty()) {
    printf("Error reading '%s'\n", fileName);
    return 1;
  }

  v8::Handle<v8::String> setVar = v8::String::New(("var arguments = [" + arguments + "];").c_str());
  ExecuteString(setVar, file_name, false, true);
  if (!ExecuteString(source, file_name, false, true)) return 1;



  if (run_shell) RunShell(context);
  return 0;
}


int main(int argc, char* argv[]) {
  int result = RunMain(argc, argv);
  v8::V8::Dispose();
  return result;
}


// Extracts a C string from a V8 Utf8Value.
const char* ToCString(const v8::String::Utf8Value& value) {
  return *value ? *value : "<string conversion failed>";
}


// The callback that is invoked by v8 whenever the JavaScript 'print'
// function is called.  Prints its arguments on stdout separated by
// spaces and ending with a newline.
v8::Handle<v8::Value> Print(const v8::Arguments& args) {
  bool first = true;
  for (int i = 0; i < args.Length(); i++) {
    v8::HandleScope handle_scope;
    if (first) {
      first = false;
    } else {
      printf(" ");
    }
    v8::String::Utf8Value str(args[i]);
    const char* cstr = ToCString(str);
    printf("%s", cstr);
  }
  printf("\n");
  fflush(stdout);
  return v8::Undefined();
}


// The callback that is invoked by v8 whenever the JavaScript 'read'
// function is called.  This function loads the content of the file named in
// the argument into a JavaScript string.
v8::Handle<v8::Value> Read(const v8::Arguments& args) {
  if (args.Length() != 1) {
    return v8::ThrowException(v8::String::New("Bad parameters"));
  }
  v8::String::Utf8Value file(args[0]);
  if (*file == NULL) {
    return v8::ThrowException(v8::String::New("Error loading file"));
  }
  v8::Handle<v8::String> source = ReadFile(*file);
  if (source.IsEmpty()) {
    return v8::ThrowException(v8::String::New("Error loading file"));
  }
  return source;
}

// Writes a v8 string into a file.
v8::Handle<v8::Value> Write(const v8::Arguments& args) {
  if (args.Length() != 2) {
    return v8::ThrowException(v8::String::New("Requires 2 Parameters"));
  }

  v8::String::Utf8Value fileName(args[0]);
  if (*fileName == NULL) {
    return v8::ThrowException(v8::String::New("FileName is null"));
  }

  v8::String::Utf8Value str(args[1]);
  const char* cstr = ToCString(str);

  FILE* file = fopen(*fileName, "w");
  if (file == NULL) return v8::ThrowException(v8::String::New("Error opening file to write"));

  fwrite(cstr, sizeof(char), strlen(cstr), file);

  fclose(file);
  v8::Handle<v8::String> result = v8::String::New("result");
  // delete[] chars;
  return result;
}



v8::Handle<v8::Value> MakeDirectory(const v8::Arguments& args) {
	if (args.Length() != 1) {
	  return v8::ThrowException(v8::String::New("Requires 1 Parameter"));
	}

	v8::String::Utf8Value dirName(args[0]);
	if (*dirName == NULL) {
	  return v8::ThrowException(v8::String::New("Directory Name is null"));
	}

	const char* name = ToCString(dirName);
	int mode = 0777; 
	
	bool success = boost::filesystem::create_directory(name);
	if (success) {
		return v8::String::New("Success");
	} else {
		return v8::String::New("Failed");
	}
}






// The callback that is invoked by v8 whenever the JavaScript 'load'
// function is called.  Loads, compiles and executes its argument
// JavaScript file.
v8::Handle<v8::Value> Load(const v8::Arguments& args) {
  for (int i = 0; i < args.Length(); i++) {
    v8::HandleScope handle_scope;
    v8::String::Utf8Value file(args[i]);
    if (*file == NULL) {
      return v8::ThrowException(v8::String::New("Error loading file"));
    }
    v8::Handle<v8::String> source = ReadFile(*file);
    if (source.IsEmpty()) {
      return v8::ThrowException(v8::String::New("Error loading file"));
    }
    if (!ExecuteString(source, v8::String::New(*file), false, false)) {
      return v8::ThrowException(v8::String::New("Error executing file"));
    }
  }
  return v8::Undefined();
}


// The callback that is invoked by v8 whenever the JavaScript 'quit'
// function is called.  Quits.
v8::Handle<v8::Value> Quit(const v8::Arguments& args) {
  // If not arguments are given args[0] will yield undefined which
  // converts to the integer value 0.
  int exit_code = args[0]->Int32Value();
  exit(exit_code);
  return v8::Undefined();
}


v8::Handle<v8::Value> Version(const v8::Arguments& args) {
  return v8::String::New(v8::V8::GetVersion());
}


// Reads a file into a v8 string.
v8::Handle<v8::String> ReadFile(const char* name) {
  FILE* file = fopen(name, "rb");
  if (file == NULL) return v8::Handle<v8::String>();

  fseek(file, 0, SEEK_END);
  int size = ftell(file);
  rewind(file);

  char* chars = new char[size + 1];
  chars[size] = '\0';
  for (int i = 0; i < size;) {
    int read = fread(&chars[i], 1, size - i, file);
    i += read;
  }
  fclose(file);
  v8::Handle<v8::String> result = v8::String::New(chars, size);
  delete[] chars;
  return result;
}


/**
 * Generic directory lister
 * @param {char *} name Directory name
 * @param {int} type Type constant - do we list files or directories?
 */
v8::Handle<v8::Value> ListFiles(const v8::Arguments& args) {
    v8::String::Utf8Value directory(args[0]);
	const char * name = ToCString(directory);
	return ListItems(name, 0);
}


/**
 * Generic directory lister
 * @param {char *} name Directory name
 * @param {int} type Type constant - do we list files or directories?
 */
v8::Handle<v8::Value> ListDirectories(const v8::Arguments& args) {
    v8::String::Utf8Value directory(args[0]);
	const char * name = ToCString(directory);
	return ListItems(name, 1);
}


/**
 * Generic directory lister
 * @param {char *} name Directory name
 * @param {int} type Type constant - do we list files or directories?
 */
v8::Handle<v8::Value> ListItems(const char* name, int type) {
	v8::HandleScope handle_scope;
	v8::Handle<v8::Array> result = v8::Array::New();
	int cnt = 0;

	DIR * dp;
	struct dirent * ep;
	int cond = (type == 0 ? DT_REG : DT_DIR);
	
	dp = opendir(name);
	if (dp == NULL)	return v8::ThrowException(v8::String::New("Directory cannot be opened"));
	while ((ep = readdir(dp))) { 
		if (ep->d_type == cond) {
			name = ep->d_name;
			if (type == 0) {
				result->Set(v8::Integer::New(cnt++), v8::String::New(ep->d_name));
			} else if ((strcmp(name, ".") != 0) && (strcmp(name, "..") != 0)) {
				result->Set(v8::Integer::New(cnt++), v8::String::New(ep->d_name));
			}
		}
	}
	closedir(dp);
	
	return handle_scope.Close(result);
}






// The read-eval-execute loop of the shell.
void RunShell(v8::Handle<v8::Context> context) {
  printf("V8 version %s\n", v8::V8::GetVersion());
  static const int kBufferSize = 256;
  while (true) {
    char buffer[kBufferSize];
    printf("> ");
    char* str = fgets(buffer, kBufferSize, stdin);
    if (str == NULL) break;
    v8::HandleScope handle_scope;
    ExecuteString(v8::String::New(str),
                  v8::String::New("(shell)"),
                  true,
                  true);
  }
  printf("\n");
}


// Executes a string within the current v8 context.
bool ExecuteString(v8::Handle<v8::String> source,
                   v8::Handle<v8::Value> name,
                   bool print_result,
                   bool report_exceptions) {
  v8::HandleScope handle_scope;
  v8::TryCatch try_catch;
  v8::Handle<v8::Script> script = v8::Script::Compile(source, name);
  if (script.IsEmpty()) {
    // Print errors that happened during compilation.
    if (report_exceptions)
      ReportException(&try_catch);
    return false;
  } else {
    v8::Handle<v8::Value> result = script->Run();
    if (result.IsEmpty()) {
      // Print errors that happened during execution.
      if (report_exceptions)
        ReportException(&try_catch);
      return false;
    } else {
      if (print_result && !result->IsUndefined()) {
        // If all went well and the result wasn't undefined then print
        // the returned value.
        v8::String::Utf8Value str(result);
        const char* cstr = ToCString(str);
        printf("%s\n", cstr);
      }
      return true;
    }
  }
}


void ReportException(v8::TryCatch* try_catch) {
  v8::HandleScope handle_scope;
  v8::String::Utf8Value exception(try_catch->Exception());
  const char* exception_string = ToCString(exception);
  v8::Handle<v8::Message> message = try_catch->Message();
  if (message.IsEmpty()) {
    // V8 didn't provide any extra information about this error; just
    // print the exception.
    printf("%s\n", exception_string);
  } else {
    // Print (filename):(line number): (message).
    v8::String::Utf8Value filename(message->GetScriptResourceName());
    const char* filename_string = ToCString(filename);
    int linenum = message->GetLineNumber();
    printf("%s:%i: %s\n", filename_string, linenum, exception_string);
    // Print line of source code.
    v8::String::Utf8Value sourceline(message->GetSourceLine());
    const char* sourceline_string = ToCString(sourceline);
    printf("%s\n", sourceline_string);
    // Print wavy underline (GetUnderline is deprecated).
    int start = message->GetStartColumn();
    for (int i = 0; i < start; i++) {
      printf(" ");
    }
    int end = message->GetEndColumn();
    for (int i = start; i < end; i++) {
      printf("^");
    }
    printf("\n");
  }
}
