-record (ob, {
	type,
	parentSituation,
	involves,
	correspondsIn,
	correspondsOut,
	childObjects,
	properties,
	content
	}).

-record (startcap, {
	type,
	parentObject,
	outputPin,
	interface
	}).

-record (pin, {
	connections,
	cache
	}).
	
-record (interface, {
	type,
	subType,
	data
	}).

% content -> Pid of process with unit(XML)
% involves -> Pid of process with set(infon)
% parentSit -> Pid of parent object
% childObjects -> Pid of process with set(objects)

% -record (situation, {
% 	content,
% 	involves,
% 	parentSituation,
% 	correspondsIn,
% 	correspondsOut,
% 	childObjects,
% 	properties
% 	}).
% 	
% -record (individual, {
% 	content,
% 	involves,
% 	parentSituation,
% 	correspondsIn,
% 	correspondsOut,
% 	properties
% 	}).
% 
% -record (relation, {
% 	content,
% 	involves,
% 	parentSituation,
% 	correspondsIn,
% 	correspondsOut,
% 	infons,
% 	properties
% 	}).
% 	
% -record (infon, {
% 	content,
% 	involves,
% 	parentSituation,
% 	correspondsIn,
% 	correspondsOut,
% 	relation,
% 	properties
% 	}).