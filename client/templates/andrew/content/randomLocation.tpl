action(myposition::SV.shape, widthbound, heightbound) {
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
	add(SV.shape:left myposition, newleft),
	add(SV.shape:top myposition, newtop),
	add(SV.shape:width myposition, newwidth),
	add(SV.shape:height myposition, newheight)
}