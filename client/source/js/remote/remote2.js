/*
    shared
   /     \
server  local
   \    /
    both
*/

var remote = {};

remote.shared = {local: false, server: false};
remote.localOnly = {local: true, server: false};
remote.serverOnly = {local: false, server: true};
remote.both = {local: true, server: true};


function maxRemote(r1, r2) {
	var local = r1.local || r2.local;
	var server = r1.server || r2.server;
	if (local) {
		if (server) return remote.both;
		else return remote.localOnly;
	} else {
		if (server) return remote.serverOnly;
		else return remote.shared;
	}
}






