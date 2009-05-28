action(pos::SV.shape, widthbound, heightbound) {
	random = function(x::Number) {
		return Math.floor(x * Math.random());
	},
	subtract = function(x::Number, y::Number) {
		return x - y;
	},
	newwidth = random(widthbound),
	newleft = random (subtract widthbound newwidth),
	newheight = random(heightbound),
	newtop = random (subtract heightbound newheight),
	add(SV.shape:left pos, newleft),
	add(SV.shape:top pos, newtop),
	add(SV.shape:width pos, newwidth),
	add(SV.shape:height pos, newheight)
}