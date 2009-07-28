




var styleNamesThatTakePx = {
	"borderBottomWidth":true, "borderLeftWidth":true, "borderRightWidth":true, "borderSpacing":true, "borderTopWidth":true,
	"bottom":true, "fontSize":true, "height":true, "left":true, "letterSpacing":true, "lineHeight":true,
	"margin":true, "marginBottom":true, "marginLeft":true, "marginRight":true, "marginTop":true,
	"maxHeight":true, "maxWidth":true, "minHeight":true, "minWidth":true,
	"MozBorderRadius":true, "MozBorderRadiusBottomleft":true, "MozBorderRadiusBottomright":true, "MozBorderRadiusTopleft":true, "MozBorderRadiusTopright":true,
	"outlineWidth":true, "padding":true, "paddingBottom":true, "paddingLeft":true, "paddingRight":true, "paddingTop":true,
	"right":true, "top":true, "width":true
};

function setNodeStyle(node, styleName, styleValue) {
	// TODO this will need some additional code for convenience/browser bullshit (px, etc)
	// https://developer.mozilla.org/en/DOM/CSS
	
	if (styleNamesThatTakePx[styleName] && styleValue !== "auto") {
		styleValue = Math.round(styleValue) + "px";
	}
	if (styleName === "float") {
		styleName = "cssFloat"; // will need to be "styleFloat" for IE
	}
	
	node.style[styleName] = styleValue;
}



function setNodeAttribute(node, attName, attValue) {
	setAttr(node, attName, attValue);
	if (attName === "contentEditable" && attValue === "true") {
		node.contentEditable = true;
	}
	if (attName === "value") {
		node.value = attValue;
	}
}

