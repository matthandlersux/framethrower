//////////////////////////////////////////////////////
// SVG-VML mini graphic library 
// ==========================================
// written by Gerard Ferrandez
// initial version - June 28, 2006
// modified - July 21 - use object functions
// modified - July 24 - debug
// www.dhteumeuleu.com
//////////////////////////////////////////////////////

var SVG = false;
var svgNS = false;
var svgAntialias = false;
if (document.createElementNS) {
	svgNS = "http://www.w3.org/2000/svg";
	svg = document.createElementNS(svgNS, "svg");
	SVG = (svg.x != null);
}

if (SVG) {
	/* ============= SVG ============== */
	$createSVGVML = function(o, antialias) {
		cont = document.createElementNS(svgNS, "svg");
		o.appendChild(cont);
		svgAntialias = antialias;
		return cont;
	}
	$createLine = function(w, col, linecap) {
		var o = document.createElementNS(svgNS, "line");
		o.setAttribute("shape-rendering", svgAntialias?"auto":"optimizeSpeed");
		o.setAttribute("stroke-width", Math.round(w)+"px");
		if (col) o.setAttribute("stroke", col);
		if (linecap) o.setAttribute("stroke-linecap", linecap);
		o.$move = function(x1, y1, x2, y2) {
			this.setAttribute("x1", x1);
			this.setAttribute("y1", y1);
			this.setAttribute("x2", x2);
			this.setAttribute("y2", y2);
		}
		o.$RGBcolor = function(R, G, B){ this.setAttribute("stroke", "rgb("+Math.round(R)+","+Math.round(G)+","+Math.round(B)+")"); }
		o.$strokeWidth = function(s){ this.setAttribute("stroke-width", Math.round(s)+"px"); }
		cont.appendChild(o);
		return o;
	}
	$createPolyline = function(w, points, col) {
		var o = document.createElementNS(svgNS, "polyline");
		o.setAttribute("shape-rendering", svgAntialias?"auto":"optimizeSpeed");
		o.setAttribute("stroke-width", Math.round(w));
		if (col) o.setAttribute("stroke", col);
		o.setAttribute("fill", "none");
		if (points) o.setAttribute("points", points);
		cont.appendChild(o);
		return o;
	}
	$createOval = function(diam, filled) {
		var o = document.createElementNS(svgNS, "circle");
		o.setAttribute("shape-rendering", svgAntialias?"auto":"optimizeSpeed");
		o.setAttribute("stroke-width", 0);
		o.setAttribute("r", Math.round(diam / 2));
		o.style.cursor = "pointer";
		o.$move = function(x1, y1, radius) {
			this.setAttribute("cx", x1);
			this.setAttribute("cy", y1);
			this.setAttribute("r", Math.round(radius));
		}
		o.$strokeColor = function(col) { this.setAttribute("stroke", col); }
		o.$fillColor = function(col) { this.setAttribute("fill", col); }
		o.$strokeWeight = function(sw) { this.setAttribute("stroke-width", sw); }
		cont.appendChild(o);
		return o;
	}
	
} else if (document.createStyleSheet) {

	/* ============= VML ============== */
	$createSVGVML = function(o, antialias) {
		document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
		var style = document.createStyleSheet();
		style.addRule('v\\:*', "behavior: url(#default#VML);");
		style.addRule('v\\:*', "antialias: "+antialias+";");
		return o;
	}
	$createLine = function(w, col, linecap) {
		var o = document.createElement("v:line");
		o.strokeweight = Math.round(w)+"px";
		if (col) o.strokecolor = col;
		o.$move = function(x1, y1, x2, y2) {
			this.to   = x1 + "," + y1;
			this.from = x2 + "," + y2;
		}
		o.$RGBcolor = function(R, G, B){ this.strokecolor = "rgb("+Math.round(R)+","+Math.round(G)+","+Math.round(B)+")"; }
		o.$strokeWidth = function(s){ this.strokeweight = Math.round(s)+"px"; }
		if (linecap) {
			s = document.createElement("v:stroke");
			s.endcap = linecap;
			o.appendChild(s);
		}
		cont.appendChild(o);
		return o;
	}
	$createPolyline = function(w, points, col) {
		var o = document.createElement("v:polyline");
		o.strokeweight = Math.round(w)+"px";
		if (col) o.strokecolor = col;
		o.points = points;
		s = document.createElement("v:fill");
		s.on = "false";
		o.appendChild(s);
		cont.appendChild(o);
		return o;
	}
	$createOval = function(diam, filled) {
		var o = document.createElement("v:oval");
		o.style.position = "absolute";
		o.style.cursor = "pointer";
		o.strokeweight = 1;
		o.filled = filled;
		o.style.width = diam + "px";
		o.style.height = diam + "px";
		o.$move = function(x1, y1, radius) {
			with (this.style) {
				left = Math.round(x1 - radius) + "px";
				top = Math.round(y1 - radius) + "px";
				width = Math.round(radius * 2) + "px";
				height = Math.round(radius * 2) + "px";
			}
		}
		o.$strokeColor = function(col) { this.strokecolor = col; }
		o.$fillColor = function(col) { this.fillcolor = col; }
		o.$strokeWeight = function(sw) { this.strokeweight = sw; }
		cont.appendChild(o);
		return o;
	}
	
} else {
	/* ==== no script ==== */
	createSVG = function(o) {
		return false;
	}
}