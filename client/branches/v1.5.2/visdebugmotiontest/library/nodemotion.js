// =================================================================
//           =====  SVG/VML vector menu  =====
// script written by Gerard Ferrandez - Ge-1-doot - June 28, 2006
// http://www.dhteumeuleu.com
// =================================================================

document.onselectstart = new Function("return false;");

function resize() {
	with (document.getElementById("canvas")) {
		nw = offsetWidth;
		nh = offsetHeight;
	}
}
onresize = resize;

document.onmousemove = function(e) {
	if (window.event) e=window.event;
	xm = (e.x || e.clientX);
	ym = (e.y || e.clientY);
}

//////////////////////////////////////////////////////////

m = {
	O : [],
	cont : 0,
	xm : 0,
	ym : 0,
	nw : 0,
	nh : 0,
	X : 0,
	Y : 0,
	X0 : 0,
	Y0 : 0,
	ox : 0,
	oy : 0,
	drag : false,
	Odraged : 0,
	ks : 0,
	////////////////////////////////////////////
	FR : 3,       // friction
	vL : 200,     // default length
	vR : 1.33,    // reduction ratio
	cC : "#fff",  // collapsed node
	cP : "#f00",  // default  node
	cE : "#666",  // expanded node
	cL : "#ccc",  // lines
	sT : "#000",  // stroke
	sS : "#f00",  // stroke over
	tX : "#666",  // text
	tS : "#fff",  // text selected
	sP : 20,      // dot size
	rS : .002,    // rotation speed
	////////////////////////////////////////////

	CreateNode : function (parent, label, col, link) {
		/* ==== init variables ==== */
		this.link = link;
		this.col = col;
		this.pR = 0;
		this.len = 0;
		this.len_ini = 0;
		this.lex = 0;
		this.angle = 0;
		this.angle_ini = 0;
		this.expanded = false;
		this.children = [];
		this.parent = parent;
		this.parent_ini = parent;
		this.visible = false;
		this.x = 0;
		this.y = 0;

		if (parent != "") {
			/* ==== push child ==== */
			parent.children.push(this);
			/* ==== calculate lengths & angles ==== */
			var a = (2 * Math.PI) / parent.children.length;
			var b = (parent != "") ? Math.random():0;
			for (var i in parent.children) {
				with (parent.children[i]) {
					angle = angle_ini = Math.PI / 2 + a * i + b;
					len = len_ini = parent.len_ini / m.vR;
				}
			}
		} else {
			/* ==== root ==== */
			this.visible = true;
			this.len_ini = m.vL * m.vR;
		}

		/* ==== create line & text elements ==== */
		this.line = $createLine(1, m.cL);
		this.text = document.createElement("span");
		this.text.onmousedown = function() { return false; };
		this.text.appendChild(document.createTextNode(label));
		this.text.style.color = m.tX;
		document.getElementById("canvas").appendChild(this.text);

		/* ==== main animation loop ==== */
		this.run = function () {
			with (this) {
				if (visible) {
					/* ==== parent coordinates ==== */
					xp = parent ? parent.x : m.X;
					yp = parent ? parent.y : m.Y;
					/* ==== trigonometry ==== */
					var a = Math.atan2((y + Math.sin(angle + m.ks) * m.FR) - yp, (x + Math.cos(angle + m.ks) * m.FR) - xp);
					if (lex < len) lex += (len - lex) * .1;
					x = xp + Math.cos(a) * lex;
					y = yp + Math.sin(a) * lex;
					/* ==== screen limits ==== */
					if (x < pR) x = pR; else if (x > nw - pR) x = nw - pR;
					if (y < pR) y = pR; else if (y > nh - pR) y = nh - pR;
					/* ==== move elements ==== */
					line.$move(x, y, xp, yp);
					plot.$move(x, y, pR);
					with (text.style) {
						left = Math.round(x + pR + 5) + "px";
						top = Math.round(y - pR / 1.8) + "px";
					}
				}
			}
		}

		/* ==== collapse node ==== */
		this.collapse = function () {
			with (this) {
				expanded = false;
				text.style.color = m.tX;
				plot.$fillColor((children.length) ? m.cC : col);
				for (var i=0; i<children.length; i++) {
					with (children[i]) {
						visible = false;
						lex = 0;
						line.$move(-1, -1, -1, -2);
						plot.$move(-1000, -1, 0);
						text.style.left = "-1000px";
						expanded = false;
						collapse();
					}
				}
			}
		}

		/* ==== expand node ==== */
		this.expand = function () {
			with (this) {
				/* ==== close all other branchs ==== */
				if (parent_ini != "")
					for (var i=0; i<parent_ini.children.length; i++)
						parent_ini.children[i].collapse();
				/* ==== expand ==== */
				expanded = true;
				text.style.color = m.tS;
				plot.$fillColor(m.cE);
				for (var i=0; i<children.length; i++) {
					children[i].visible = true;
					children[i].lex = 0;
				}
			}
		}
	},

	/* ==== mouse down event ==== */
	mousedown : function() {
		var o = this.obj;
		/* ==== cursor ==== */
		o.plot.style.cursor = "move";
		document.body.style.cursor = "move";
		/* ==== offset mouse ==== */
		m.ox = xm - o.x;
		m.oy = ym - o.y;
		m.X0 = xm;
		m.Y0 = ym;
		if (!m.drag) {
			m.drag = true;
			/* ==== change root ==== */
			if (m.Odraged != o) {
				/* ==== reset ==== */
				for (var i in m.O) {
					with (m.O[i]) {
						parent = parent_ini;
						len    = len_ini;
						lex    = len_ini;
						angle  = angle_ini;
					}
				}
				/* ==== search for root path ==== */
				var oc = [];
				var ow = o;
				oc.push(ow);
				while(ow.parent != "") {
					ow = ow.parent;
					oc.push(ow);
				}
				/* ==== inverse vectors ==== */
				for (var i=1; i<oc.length; i++) {
					oc[i].lex    = oc[i-1].len_ini;
					oc[i].len    = oc[i-1].len_ini;
					oc[i].angle  = oc[i-1].angle_ini - Math.PI;
					oc[i].parent = oc[i-1];
				}
				/* ==== switch root ==== */
				o.parent = "";
				o.len = 0;
				o.lex = 0;
				o.angle = 0;
				m.Odraged.plot.$strokeColor(m.sT);
				m.Odraged.plot.$strokeWeight(1);
				m.Odraged = o;
			}
			return false;
		}
	},

	/* ==== mouse up event ==== */
	mouseup : function() {
		m.drag = false;
		/* ==== cursor ==== */
		m.Odraged.plot.style.cursor = "pointer";
		document.body.style.cursor = "crosshair";
		/* ==== click ==== */
		if (Math.abs(m.X + m.ox - m.X0) < 5 && Math.abs(m.Y + m.oy - m.Y0) < 5) {
			if (this.obj.link) {
				/* ==== open hyperlink ==== */
				window.open(this.obj.link, "_blank");
			} else {
				/* ==== expand / collapse ==== */
				if (this.obj.expanded) this.obj.collapse(); else this.obj.expand();
			}
		}
		return false;
	},

	/* ==== mouse over event ==== */
	mouseover : function() {
		this.$strokeColor(m.sS);
		this.$strokeWeight(Math.round(Math.max(2, this.obj.pR / 3)));
		return false;
	},

	/* ==== mouse out event ==== */
	mouseout : function() {
		if (this.obj != m.Odraged) {
			this.$strokeColor(m.sT);
			this.$strokeWeight(1);
		}
		return false;
	},

	/* ==== motion thread ==== */
	run : function () {
		if (m.drag) m.X = xm - m.ox, m.Y = ym - m.oy;
		m.ks += m.rS;
		for (var i in m.O) m.O[i].run();
	},

	/* ==== parse menu DOM ==== */
	setMenuTree : function (theNode, parent) {
		if (theNode.tagName == "html:div" || theNode.tagName == "html:a") {
			/* ==== Node Label ==== */
			var s = theNode.innerHTML;
			var d = s.toUpperCase().indexOf("<HTML:DIV");
			if (d > 0) s = s.substring(0, d);
			d = s.toUpperCase().indexOf("<HTML:A");
			if (d > 0) s = s.substring(0, d);
			/* ==== create Node ==== */
			if(theNode.style.color != "") m.cP = theNode.style.color;
			parent = new m.CreateNode(parent, s, m.cP, theNode.href);
			/* ==== push Node ==== */
			m.O.push(parent);
		}
		/* ==== recursive call ==== */
		for (var i = 0; i < theNode.childNodes.length; i++)
			m.setMenuTree(theNode.childNodes[i], parent);
	},

	/* ==== init menu ==== */
	init : function(rootElement) {
		m.vL = nh / 4;
		m.X = nw / 2;
		m.Y = nh / 2;
		m.setMenuTree(rootElement, "");

		/* ==== create plots (no z-index in SVG!) ==== */
		for (var i in m.O) {
			m.O[i].pR = Math.round(Math.max(5, m.sP * m.O[i].len_ini / 200));
			m.O[i].plot = $createOval(m.O[i].pR * 2, true);
			m.O[i].plot.$strokeColor(m.sT);
			m.O[i].plot.$strokeWeight(1);
			m.O[i].plot.obj = m.O[i];
			m.O[i].plot.onmousedown = m.mousedown;
			m.O[i].plot.onmouseup = m.mouseup;
			m.O[i].plot.onmouseover = m.mouseover;
			m.O[i].plot.onmouseout = m.mouseout;
			m.O[i].plot.onclick = function() { return false; };
			m.O[i].text.style.fontSize = (4 + m.O[i].pR) + "px";
		}

		/* ==== expand 1st Node ==== */
		m.Odraged = m.O[0];
		m.O[0].collapse();
		m.O[0].expand();
	}
}

var load = function(rootNode) {
	/* ==== initial size ==== */
	resize();
	/* ==== create SVGVML container ==== */
	cont = $createSVGVML(document.getElementById("canvas"), false);
	if (cont) {
		/* ==== init menu ==== */
		m.init(rootNode);
		setInterval("m.run();", 16);
	}
}