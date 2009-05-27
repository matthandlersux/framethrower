action(myleft, mytop, mywidth, myheight, widthbound, heightbound) {
	random = function(x::Number) {
		return Math.floor(x * Math.random());
	},
	subtract = function(x::Number, y::Number) {
		return x - y;
	},
	newwidth = random(widthbound),
	// newleft = random (subtract widthbound newwidth),
	newleft = 0,
	newheight = random(heightbound),
	newtop = random (subtract heightbound newheight),
	add(myleft, newleft),
	add(mytop, newtop),
	add(mywidth, newwidth),
	add(myheight, newheight)
}