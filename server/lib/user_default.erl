-module (user_default).
-compile( export_all ).

cc([H|_] = ListOfFiles) when is_list(H) orelse is_atom(H) ->
	lists:foreach(fun cc/1, ListOfFiles);
cc(File) when is_atom(File) -> 
	File1 = atom_to_list(File),
	cc(File1);
cc(File) ->
	File1 = "src/" ++ File,
	c:c(File1, [nowarn_unused_vars, {outdir, "./ebin/"}]).
	
ccd(File) when is_atom(File) -> 
	File1 = atom_to_list(File),
	cc(File1);
ccd(File) ->
	File1 = "src/" ++ File,
	c:c(File1, [nowarn_unused_vars, {outdir, "./ebin/"}, debug_info]).