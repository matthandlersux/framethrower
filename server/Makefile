all: mbrella pipeline

pipeline: mochiweb
	(cd pipeline;$(MAKE))

mochiweb:
	(cd mochiweb;$(MAKE))
	
mbrella:
	(cd mbrella/v1.4/;$(MAKE))