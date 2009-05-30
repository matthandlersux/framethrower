/*
	Default driver template for JS/CC generated parsers for Mozilla/Rhino
	
	WARNING: Do not use for parsers that should run as browser-based JavaScript!
			 Use driver_web.js_ instead!
	
	Features:
	- Parser trace messages
	- Step-by-step parsing
	- Integrated panic-mode error recovery
	- Pseudo-graphical parse tree generation
	
	Written 2007 by Jan Max Meyer, J.M.K S.F. Software Technologies
        Modified 2007 from driver.js_ to support Mozilla/Rhino
           by Louis P.Santillan <lpsantil@gmail.com>
	
	This is in the public domain.
*/


var preParser = function() {

	var output = "";

	function makeTextNode(text) {
		return "<p:textnode>" + text + "</p:textnode>";
	}
	
	function makeFunction(text) {
		return "<p:function>" + text + "</p:function>"
	}



var _dbg_withparsetree	= false;
var _dbg_withtrace		= false;
var _dbg_withstepbystep	= false;

function __dbg_print( text )
{
	print( text );
}

function __dbg_wait()
{
   var kbd = new java.io.BufferedReader(
                new java.io.InputStreamReader( java.lang.System[ "in" ] ) );

   kbd.readLine();
}

function __lex( info )
{
	var state		= 0;
	var match		= -1;
	var match_pos	= 0;
	var start		= 0;
	var pos			= info.offset + 1;

	do
	{
		pos--;
		state = 0;
		match = -2;
		start = pos;

		if( info.src.length <= start )
			return 27;

		do
		{

switch( state )
{
	case 0:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 44 ) || info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 101 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 40 ) state = 3;
		else if( info.src.charCodeAt( pos ) == 41 ) state = 4;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 5;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 6;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 7;
		else if( info.src.charCodeAt( pos ) == 123 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 125 ) state = 9;
		else if( info.src.charCodeAt( pos ) == 45 ) state = 18;
		else if( info.src.charCodeAt( pos ) == 32 ) state = 30;
		else if( info.src.charCodeAt( pos ) == 102 ) state = 33;
		else state = -1;
		break;

	case 1:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 2:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 2;
		else state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 5:
		if( info.src.charCodeAt( pos ) == 62 ) state = 11;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 17;
		else state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 6:
		if( info.src.charCodeAt( pos ) == 47 ) state = 12;
		else if( info.src.charCodeAt( pos ) == 102 ) state = 20;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 7:
		state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 8:
		state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 9:
		state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 10:
		state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 11:
		state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 12:
		state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 13:
		state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 14:
		state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 15:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 16:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 17:
		if( info.src.charCodeAt( pos ) == 10 ) state = 13;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 9 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 254 ) ) state = 17;
		else state = -1;
		break;

	case 18:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 10;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 19:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 23;
		else state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 20:
		if( info.src.charCodeAt( pos ) == 58 ) state = 22;
		else state = -1;
		break;

	case 21:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 110 ) state = 16;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 22:
		if( info.src.charCodeAt( pos ) == 62 ) state = 14;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 22;
		else state = -1;
		break;

	case 23:
		if( info.src.charCodeAt( pos ) == 47 ) state = 24;
		else state = -1;
		break;

	case 24:
		if( info.src.charCodeAt( pos ) == 10 ) state = 15;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 9 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 254 ) ) state = 24;
		else state = -1;
		break;

	case 25:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 110 ) || ( info.src.charCodeAt( pos ) >= 112 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 111 ) state = 21;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 26:
		if( info.src.charCodeAt( pos ) == 9 || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 10 ) state = 19;
		else state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 27:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 105 ) state = 25;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 28:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 32 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 13 ) state = 26;
		else state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 29:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 116 ) state = 27;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 30:
		if( info.src.charCodeAt( pos ) == 10 || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 9 ) state = 28;
		else state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 31:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 98 ) || ( info.src.charCodeAt( pos ) >= 100 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 99 ) state = 29;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 32:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 110 ) state = 31;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 33:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 8 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 12 ) || ( info.src.charCodeAt( pos ) >= 14 && info.src.charCodeAt( pos ) <= 31 ) || ( info.src.charCodeAt( pos ) >= 33 && info.src.charCodeAt( pos ) <= 39 ) || ( info.src.charCodeAt( pos ) >= 42 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 116 ) || ( info.src.charCodeAt( pos ) >= 118 && info.src.charCodeAt( pos ) <= 122 ) || info.src.charCodeAt( pos ) == 124 || ( info.src.charCodeAt( pos ) >= 126 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 117 ) state = 32;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

}


			pos++;

		}
		while( state > -1 );

	}
	while( 1 > -1 && match == 1 );

	if( match > -1 )
	{
		info.att = info.src.substr( start, match_pos - start );
		info.offset = match_pos;
		

	}
	else
	{
		info.att = new String();
		match = -1;
	}

	return match;
}


function __parse( src, err_off, err_la )
{
	var		sstack			= new Array();
	var		vstack			= new Array();
	var 	err_cnt			= 0;
	var		act;
	var		go;
	var		la;
	var		rval;
	var 	parseinfo		= new Function( "", "var offset; var src; var att;" );
	var		info			= new parseinfo();
	
	//Visual parse tree generation
	var 	treenode		= new Function( "", "var sym; var att; var child;" );
	var		treenodes		= new Array();
	var		tree			= new Array();
	var		tmptree			= null;

/* Pop-Table */
var pop_tab = new Array(
	new Array( 0/* TOP' */, 1 ),
	new Array( 18/* TOP */, 1 ),
	new Array( 17/* CONTENT */, 2 ),
	new Array( 17/* CONTENT */, 2 ),
	new Array( 17/* CONTENT */, 6 ),
	new Array( 17/* CONTENT */, 2 ),
	new Array( 17/* CONTENT */, 0 ),
	new Array( 22/* FUNCTIONBODY */, 2 ),
	new Array( 22/* FUNCTIONBODY */, 2 ),
	new Array( 22/* FUNCTIONBODY */, 4 ),
	new Array( 22/* FUNCTIONBODY */, 0 ),
	new Array( 21/* ARGS */, 2 ),
	new Array( 21/* ARGS */, 2 ),
	new Array( 21/* ARGS */, 0 ),
	new Array( 23/* NONBRACKET */, 0 ),
	new Array( 23/* NONBRACKET */, 1 ),
	new Array( 23/* NONBRACKET */, 1 ),
	new Array( 23/* NONBRACKET */, 1 ),
	new Array( 23/* NONBRACKET */, 1 ),
	new Array( 23/* NONBRACKET */, 1 ),
	new Array( 23/* NONBRACKET */, 1 ),
	new Array( 23/* NONBRACKET */, 1 ),
	new Array( 23/* NONBRACKET */, 1 ),
	new Array( 23/* NONBRACKET */, 1 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 2 ),
	new Array( 19/* TEXT */, 0 ),
	new Array( 20/* XML */, 5 ),
	new Array( 20/* XML */, 7 ),
	new Array( 20/* XML */, 3 ),
	new Array( 26/* NONGT */, 1 ),
	new Array( 26/* NONGT */, 1 ),
	new Array( 26/* NONGT */, 1 ),
	new Array( 26/* NONGT */, 1 ),
	new Array( 26/* NONGT */, 1 ),
	new Array( 26/* NONGT */, 1 ),
	new Array( 26/* NONGT */, 1 ),
	new Array( 24/* INTAG */, 2 ),
	new Array( 24/* INTAG */, 2 ),
	new Array( 24/* INTAG */, 0 ),
	new Array( 25/* INXMLCONTENT */, 2 ),
	new Array( 25/* INXMLCONTENT */, 2 ),
	new Array( 25/* INXMLCONTENT */, 6 ),
	new Array( 25/* INXMLCONTENT */, 2 ),
	new Array( 25/* INXMLCONTENT */, 0 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 27/* "$" */,-6 , 16/* "IDENTIFIER" */,-6 , 15/* "WS" */,-6 , 7/* ">" */,-6 , 4/* "/>" */,-6 , 6/* "->" */,-6 , 11/* "/" */,-6 , 8/* "{" */,-6 , 9/* "}" */,-6 , 13/* "(" */,-6 , 14/* ")" */,-6 , 2/* "FTAG" */,-6 , 5/* "<" */,-6 , 12/* "function" */,-6 , 10/* "COMMENT" */,-6 ),
	/* State 1 */ new Array( 27/* "$" */,0 ),
	/* State 2 */ new Array( 10/* "COMMENT" */,3 , 12/* "function" */,4 , 2/* "FTAG" */,7 , 5/* "<" */,8 , 27/* "$" */,-1 , 16/* "IDENTIFIER" */,-34 , 15/* "WS" */,-34 , 7/* ">" */,-34 , 4/* "/>" */,-34 , 6/* "->" */,-34 , 11/* "/" */,-34 , 8/* "{" */,-34 , 9/* "}" */,-34 , 13/* "(" */,-34 , 14/* ")" */,-34 ),
	/* State 3 */ new Array( 27/* "$" */,-5 , 16/* "IDENTIFIER" */,-5 , 15/* "WS" */,-5 , 7/* ">" */,-5 , 4/* "/>" */,-5 , 6/* "->" */,-5 , 11/* "/" */,-5 , 8/* "{" */,-5 , 9/* "}" */,-5 , 13/* "(" */,-5 , 14/* ")" */,-5 , 2/* "FTAG" */,-5 , 5/* "<" */,-5 , 12/* "function" */,-5 , 10/* "COMMENT" */,-5 , 3/* "</" */,-5 ),
	/* State 4 */ new Array( 8/* "{" */,-13 , 16/* "IDENTIFIER" */,-13 , 7/* ">" */,-13 , 4/* "/>" */,-13 , 6/* "->" */,-13 , 11/* "/" */,-13 , 13/* "(" */,-13 , 14/* ")" */,-13 , 15/* "WS" */,-13 , 2/* "FTAG" */,-13 , 12/* "function" */,-13 ),
	/* State 5 */ new Array( 27/* "$" */,-3 , 16/* "IDENTIFIER" */,-3 , 15/* "WS" */,-3 , 7/* ">" */,-3 , 4/* "/>" */,-3 , 6/* "->" */,-3 , 11/* "/" */,-3 , 8/* "{" */,-3 , 9/* "}" */,-3 , 13/* "(" */,-3 , 14/* ")" */,-3 , 2/* "FTAG" */,-3 , 5/* "<" */,-3 , 12/* "function" */,-3 , 10/* "COMMENT" */,-3 , 3/* "</" */,-3 ),
	/* State 6 */ new Array( 14/* ")" */,10 , 13/* "(" */,11 , 9/* "}" */,12 , 8/* "{" */,13 , 11/* "/" */,14 , 6/* "->" */,15 , 4/* "/>" */,16 , 7/* ">" */,17 , 15/* "WS" */,18 , 16/* "IDENTIFIER" */,19 , 27/* "$" */,-2 , 2/* "FTAG" */,-2 , 5/* "<" */,-2 , 12/* "function" */,-2 , 10/* "COMMENT" */,-2 , 3/* "</" */,-2 ),
	/* State 7 */ new Array( 3/* "</" */,-6 , 16/* "IDENTIFIER" */,-6 , 15/* "WS" */,-6 , 7/* ">" */,-6 , 4/* "/>" */,-6 , 6/* "->" */,-6 , 11/* "/" */,-6 , 8/* "{" */,-6 , 9/* "}" */,-6 , 13/* "(" */,-6 , 14/* ")" */,-6 , 2/* "FTAG" */,-6 , 5/* "<" */,-6 , 12/* "function" */,-6 , 10/* "COMMENT" */,-6 ),
	/* State 8 */ new Array( 7/* ">" */,-47 , 4/* "/>" */,-47 , 16/* "IDENTIFIER" */,-47 , 6/* "->" */,-47 , 8/* "{" */,-47 , 9/* "}" */,-47 , 13/* "(" */,-47 , 14/* ")" */,-47 , 15/* "WS" */,-47 , 12/* "function" */,-47 ),
	/* State 9 */ new Array( 16/* "IDENTIFIER" */,23 , 8/* "{" */,24 , 7/* ">" */,25 , 4/* "/>" */,26 , 6/* "->" */,27 , 11/* "/" */,28 , 13/* "(" */,29 , 14/* ")" */,30 , 15/* "WS" */,31 , 2/* "FTAG" */,32 , 12/* "function" */,33 ),
	/* State 10 */ new Array( 27/* "$" */,-33 , 16/* "IDENTIFIER" */,-33 , 15/* "WS" */,-33 , 7/* ">" */,-33 , 4/* "/>" */,-33 , 6/* "->" */,-33 , 11/* "/" */,-33 , 8/* "{" */,-33 , 9/* "}" */,-33 , 13/* "(" */,-33 , 14/* ")" */,-33 , 2/* "FTAG" */,-33 , 5/* "<" */,-33 , 12/* "function" */,-33 , 10/* "COMMENT" */,-33 , 3/* "</" */,-33 ),
	/* State 11 */ new Array( 27/* "$" */,-32 , 16/* "IDENTIFIER" */,-32 , 15/* "WS" */,-32 , 7/* ">" */,-32 , 4/* "/>" */,-32 , 6/* "->" */,-32 , 11/* "/" */,-32 , 8/* "{" */,-32 , 9/* "}" */,-32 , 13/* "(" */,-32 , 14/* ")" */,-32 , 2/* "FTAG" */,-32 , 5/* "<" */,-32 , 12/* "function" */,-32 , 10/* "COMMENT" */,-32 , 3/* "</" */,-32 ),
	/* State 12 */ new Array( 27/* "$" */,-31 , 16/* "IDENTIFIER" */,-31 , 15/* "WS" */,-31 , 7/* ">" */,-31 , 4/* "/>" */,-31 , 6/* "->" */,-31 , 11/* "/" */,-31 , 8/* "{" */,-31 , 9/* "}" */,-31 , 13/* "(" */,-31 , 14/* ")" */,-31 , 2/* "FTAG" */,-31 , 5/* "<" */,-31 , 12/* "function" */,-31 , 10/* "COMMENT" */,-31 , 3/* "</" */,-31 ),
	/* State 13 */ new Array( 27/* "$" */,-30 , 16/* "IDENTIFIER" */,-30 , 15/* "WS" */,-30 , 7/* ">" */,-30 , 4/* "/>" */,-30 , 6/* "->" */,-30 , 11/* "/" */,-30 , 8/* "{" */,-30 , 9/* "}" */,-30 , 13/* "(" */,-30 , 14/* ")" */,-30 , 2/* "FTAG" */,-30 , 5/* "<" */,-30 , 12/* "function" */,-30 , 10/* "COMMENT" */,-30 , 3/* "</" */,-30 ),
	/* State 14 */ new Array( 27/* "$" */,-29 , 16/* "IDENTIFIER" */,-29 , 15/* "WS" */,-29 , 7/* ">" */,-29 , 4/* "/>" */,-29 , 6/* "->" */,-29 , 11/* "/" */,-29 , 8/* "{" */,-29 , 9/* "}" */,-29 , 13/* "(" */,-29 , 14/* ")" */,-29 , 2/* "FTAG" */,-29 , 5/* "<" */,-29 , 12/* "function" */,-29 , 10/* "COMMENT" */,-29 , 3/* "</" */,-29 ),
	/* State 15 */ new Array( 27/* "$" */,-28 , 16/* "IDENTIFIER" */,-28 , 15/* "WS" */,-28 , 7/* ">" */,-28 , 4/* "/>" */,-28 , 6/* "->" */,-28 , 11/* "/" */,-28 , 8/* "{" */,-28 , 9/* "}" */,-28 , 13/* "(" */,-28 , 14/* ")" */,-28 , 2/* "FTAG" */,-28 , 5/* "<" */,-28 , 12/* "function" */,-28 , 10/* "COMMENT" */,-28 , 3/* "</" */,-28 ),
	/* State 16 */ new Array( 27/* "$" */,-27 , 16/* "IDENTIFIER" */,-27 , 15/* "WS" */,-27 , 7/* ">" */,-27 , 4/* "/>" */,-27 , 6/* "->" */,-27 , 11/* "/" */,-27 , 8/* "{" */,-27 , 9/* "}" */,-27 , 13/* "(" */,-27 , 14/* ")" */,-27 , 2/* "FTAG" */,-27 , 5/* "<" */,-27 , 12/* "function" */,-27 , 10/* "COMMENT" */,-27 , 3/* "</" */,-27 ),
	/* State 17 */ new Array( 27/* "$" */,-26 , 16/* "IDENTIFIER" */,-26 , 15/* "WS" */,-26 , 7/* ">" */,-26 , 4/* "/>" */,-26 , 6/* "->" */,-26 , 11/* "/" */,-26 , 8/* "{" */,-26 , 9/* "}" */,-26 , 13/* "(" */,-26 , 14/* ")" */,-26 , 2/* "FTAG" */,-26 , 5/* "<" */,-26 , 12/* "function" */,-26 , 10/* "COMMENT" */,-26 , 3/* "</" */,-26 ),
	/* State 18 */ new Array( 27/* "$" */,-25 , 16/* "IDENTIFIER" */,-25 , 15/* "WS" */,-25 , 7/* ">" */,-25 , 4/* "/>" */,-25 , 6/* "->" */,-25 , 11/* "/" */,-25 , 8/* "{" */,-25 , 9/* "}" */,-25 , 13/* "(" */,-25 , 14/* ")" */,-25 , 2/* "FTAG" */,-25 , 5/* "<" */,-25 , 12/* "function" */,-25 , 10/* "COMMENT" */,-25 , 3/* "</" */,-25 ),
	/* State 19 */ new Array( 27/* "$" */,-24 , 16/* "IDENTIFIER" */,-24 , 15/* "WS" */,-24 , 7/* ">" */,-24 , 4/* "/>" */,-24 , 6/* "->" */,-24 , 11/* "/" */,-24 , 8/* "{" */,-24 , 9/* "}" */,-24 , 13/* "(" */,-24 , 14/* ")" */,-24 , 2/* "FTAG" */,-24 , 5/* "<" */,-24 , 12/* "function" */,-24 , 10/* "COMMENT" */,-24 , 3/* "</" */,-24 ),
	/* State 20 */ new Array( 10/* "COMMENT" */,3 , 12/* "function" */,4 , 3/* "</" */,34 , 2/* "FTAG" */,7 , 5/* "<" */,8 , 16/* "IDENTIFIER" */,-34 , 15/* "WS" */,-34 , 7/* ">" */,-34 , 4/* "/>" */,-34 , 6/* "->" */,-34 , 11/* "/" */,-34 , 8/* "{" */,-34 , 9/* "}" */,-34 , 13/* "(" */,-34 , 14/* ")" */,-34 ),
	/* State 21 */ new Array( 16/* "IDENTIFIER" */,36 , 7/* ">" */,37 , 4/* "/>" */,38 , 6/* "->" */,39 , 8/* "{" */,40 , 9/* "}" */,41 , 13/* "(" */,42 , 14/* ")" */,43 , 15/* "WS" */,44 , 12/* "function" */,45 ),
	/* State 22 */ new Array( 8/* "{" */,-12 , 16/* "IDENTIFIER" */,-12 , 7/* ">" */,-12 , 4/* "/>" */,-12 , 6/* "->" */,-12 , 11/* "/" */,-12 , 13/* "(" */,-12 , 14/* ")" */,-12 , 15/* "WS" */,-12 , 2/* "FTAG" */,-12 , 12/* "function" */,-12 ),
	/* State 23 */ new Array( 8/* "{" */,-11 , 16/* "IDENTIFIER" */,-11 , 7/* ">" */,-11 , 4/* "/>" */,-11 , 6/* "->" */,-11 , 11/* "/" */,-11 , 13/* "(" */,-11 , 14/* ")" */,-11 , 15/* "WS" */,-11 , 2/* "FTAG" */,-11 , 12/* "function" */,-11 ),
	/* State 24 */ new Array( 9/* "}" */,-10 , 16/* "IDENTIFIER" */,-10 , 7/* ">" */,-10 , 4/* "/>" */,-10 , 6/* "->" */,-10 , 11/* "/" */,-10 , 13/* "(" */,-10 , 14/* ")" */,-10 , 15/* "WS" */,-10 , 2/* "FTAG" */,-10 , 12/* "function" */,-10 , 8/* "{" */,-10 ),
	/* State 25 */ new Array( 8/* "{" */,-15 , 16/* "IDENTIFIER" */,-15 , 7/* ">" */,-15 , 4/* "/>" */,-15 , 6/* "->" */,-15 , 11/* "/" */,-15 , 13/* "(" */,-15 , 14/* ")" */,-15 , 15/* "WS" */,-15 , 2/* "FTAG" */,-15 , 12/* "function" */,-15 , 9/* "}" */,-15 ),
	/* State 26 */ new Array( 8/* "{" */,-16 , 16/* "IDENTIFIER" */,-16 , 7/* ">" */,-16 , 4/* "/>" */,-16 , 6/* "->" */,-16 , 11/* "/" */,-16 , 13/* "(" */,-16 , 14/* ")" */,-16 , 15/* "WS" */,-16 , 2/* "FTAG" */,-16 , 12/* "function" */,-16 , 9/* "}" */,-16 ),
	/* State 27 */ new Array( 8/* "{" */,-17 , 16/* "IDENTIFIER" */,-17 , 7/* ">" */,-17 , 4/* "/>" */,-17 , 6/* "->" */,-17 , 11/* "/" */,-17 , 13/* "(" */,-17 , 14/* ")" */,-17 , 15/* "WS" */,-17 , 2/* "FTAG" */,-17 , 12/* "function" */,-17 , 9/* "}" */,-17 ),
	/* State 28 */ new Array( 8/* "{" */,-18 , 16/* "IDENTIFIER" */,-18 , 7/* ">" */,-18 , 4/* "/>" */,-18 , 6/* "->" */,-18 , 11/* "/" */,-18 , 13/* "(" */,-18 , 14/* ")" */,-18 , 15/* "WS" */,-18 , 2/* "FTAG" */,-18 , 12/* "function" */,-18 , 9/* "}" */,-18 ),
	/* State 29 */ new Array( 8/* "{" */,-19 , 16/* "IDENTIFIER" */,-19 , 7/* ">" */,-19 , 4/* "/>" */,-19 , 6/* "->" */,-19 , 11/* "/" */,-19 , 13/* "(" */,-19 , 14/* ")" */,-19 , 15/* "WS" */,-19 , 2/* "FTAG" */,-19 , 12/* "function" */,-19 , 9/* "}" */,-19 ),
	/* State 30 */ new Array( 8/* "{" */,-20 , 16/* "IDENTIFIER" */,-20 , 7/* ">" */,-20 , 4/* "/>" */,-20 , 6/* "->" */,-20 , 11/* "/" */,-20 , 13/* "(" */,-20 , 14/* ")" */,-20 , 15/* "WS" */,-20 , 2/* "FTAG" */,-20 , 12/* "function" */,-20 , 9/* "}" */,-20 ),
	/* State 31 */ new Array( 8/* "{" */,-21 , 16/* "IDENTIFIER" */,-21 , 7/* ">" */,-21 , 4/* "/>" */,-21 , 6/* "->" */,-21 , 11/* "/" */,-21 , 13/* "(" */,-21 , 14/* ")" */,-21 , 15/* "WS" */,-21 , 2/* "FTAG" */,-21 , 12/* "function" */,-21 , 9/* "}" */,-21 ),
	/* State 32 */ new Array( 8/* "{" */,-22 , 16/* "IDENTIFIER" */,-22 , 7/* ">" */,-22 , 4/* "/>" */,-22 , 6/* "->" */,-22 , 11/* "/" */,-22 , 13/* "(" */,-22 , 14/* ")" */,-22 , 15/* "WS" */,-22 , 2/* "FTAG" */,-22 , 12/* "function" */,-22 , 9/* "}" */,-22 ),
	/* State 33 */ new Array( 8/* "{" */,-23 , 16/* "IDENTIFIER" */,-23 , 7/* ">" */,-23 , 4/* "/>" */,-23 , 6/* "->" */,-23 , 11/* "/" */,-23 , 13/* "(" */,-23 , 14/* ")" */,-23 , 15/* "WS" */,-23 , 2/* "FTAG" */,-23 , 12/* "function" */,-23 , 9/* "}" */,-23 ),
	/* State 34 */ new Array( 16/* "IDENTIFIER" */,47 ),
	/* State 35 */ new Array( 7/* ">" */,-46 , 4/* "/>" */,-46 , 16/* "IDENTIFIER" */,-46 , 6/* "->" */,-46 , 8/* "{" */,-46 , 9/* "}" */,-46 , 13/* "(" */,-46 , 14/* ")" */,-46 , 15/* "WS" */,-46 , 12/* "function" */,-46 ),
	/* State 36 */ new Array( 7/* ">" */,-45 , 4/* "/>" */,-45 , 16/* "IDENTIFIER" */,-45 , 6/* "->" */,-45 , 8/* "{" */,-45 , 9/* "}" */,-45 , 13/* "(" */,-45 , 14/* ")" */,-45 , 15/* "WS" */,-45 , 12/* "function" */,-45 ),
	/* State 37 */ new Array( 3/* "</" */,-52 , 16/* "IDENTIFIER" */,-52 , 15/* "WS" */,-52 , 7/* ">" */,-52 , 4/* "/>" */,-52 , 6/* "->" */,-52 , 11/* "/" */,-52 , 8/* "{" */,-52 , 9/* "}" */,-52 , 13/* "(" */,-52 , 14/* ")" */,-52 , 2/* "FTAG" */,-52 , 5/* "<" */,-52 , 12/* "function" */,-52 , 10/* "COMMENT" */,-52 ),
	/* State 38 */ new Array( 27/* "$" */,-37 , 16/* "IDENTIFIER" */,-37 , 15/* "WS" */,-37 , 7/* ">" */,-37 , 4/* "/>" */,-37 , 6/* "->" */,-37 , 11/* "/" */,-37 , 8/* "{" */,-37 , 9/* "}" */,-37 , 13/* "(" */,-37 , 14/* ")" */,-37 , 2/* "FTAG" */,-37 , 5/* "<" */,-37 , 12/* "function" */,-37 , 10/* "COMMENT" */,-37 , 3/* "</" */,-37 ),
	/* State 39 */ new Array( 7/* ">" */,-38 , 4/* "/>" */,-38 , 16/* "IDENTIFIER" */,-38 , 6/* "->" */,-38 , 8/* "{" */,-38 , 9/* "}" */,-38 , 13/* "(" */,-38 , 14/* ")" */,-38 , 15/* "WS" */,-38 , 12/* "function" */,-38 ),
	/* State 40 */ new Array( 7/* ">" */,-39 , 4/* "/>" */,-39 , 16/* "IDENTIFIER" */,-39 , 6/* "->" */,-39 , 8/* "{" */,-39 , 9/* "}" */,-39 , 13/* "(" */,-39 , 14/* ")" */,-39 , 15/* "WS" */,-39 , 12/* "function" */,-39 ),
	/* State 41 */ new Array( 7/* ">" */,-40 , 4/* "/>" */,-40 , 16/* "IDENTIFIER" */,-40 , 6/* "->" */,-40 , 8/* "{" */,-40 , 9/* "}" */,-40 , 13/* "(" */,-40 , 14/* ")" */,-40 , 15/* "WS" */,-40 , 12/* "function" */,-40 ),
	/* State 42 */ new Array( 7/* ">" */,-41 , 4/* "/>" */,-41 , 16/* "IDENTIFIER" */,-41 , 6/* "->" */,-41 , 8/* "{" */,-41 , 9/* "}" */,-41 , 13/* "(" */,-41 , 14/* ")" */,-41 , 15/* "WS" */,-41 , 12/* "function" */,-41 ),
	/* State 43 */ new Array( 7/* ">" */,-42 , 4/* "/>" */,-42 , 16/* "IDENTIFIER" */,-42 , 6/* "->" */,-42 , 8/* "{" */,-42 , 9/* "}" */,-42 , 13/* "(" */,-42 , 14/* ")" */,-42 , 15/* "WS" */,-42 , 12/* "function" */,-42 ),
	/* State 44 */ new Array( 7/* ">" */,-43 , 4/* "/>" */,-43 , 16/* "IDENTIFIER" */,-43 , 6/* "->" */,-43 , 8/* "{" */,-43 , 9/* "}" */,-43 , 13/* "(" */,-43 , 14/* ")" */,-43 , 15/* "WS" */,-43 , 12/* "function" */,-43 ),
	/* State 45 */ new Array( 7/* ">" */,-44 , 4/* "/>" */,-44 , 16/* "IDENTIFIER" */,-44 , 6/* "->" */,-44 , 8/* "{" */,-44 , 9/* "}" */,-44 , 13/* "(" */,-44 , 14/* ")" */,-44 , 15/* "WS" */,-44 , 12/* "function" */,-44 ),
	/* State 46 */ new Array( 8/* "{" */,49 , 16/* "IDENTIFIER" */,51 , 9/* "}" */,52 , 7/* ">" */,25 , 4/* "/>" */,26 , 6/* "->" */,27 , 11/* "/" */,28 , 13/* "(" */,29 , 14/* ")" */,30 , 15/* "WS" */,31 , 2/* "FTAG" */,32 , 12/* "function" */,33 ),
	/* State 47 */ new Array( 7/* ">" */,53 ),
	/* State 48 */ new Array( 10/* "COMMENT" */,54 , 12/* "function" */,55 , 3/* "</" */,58 , 2/* "FTAG" */,7 , 5/* "<" */,8 , 16/* "IDENTIFIER" */,-34 , 15/* "WS" */,-34 , 7/* ">" */,-34 , 4/* "/>" */,-34 , 6/* "->" */,-34 , 11/* "/" */,-34 , 8/* "{" */,-34 , 9/* "}" */,-34 , 13/* "(" */,-34 , 14/* ")" */,-34 ),
	/* State 49 */ new Array( 9/* "}" */,-10 , 16/* "IDENTIFIER" */,-10 , 7/* ">" */,-10 , 4/* "/>" */,-10 , 6/* "->" */,-10 , 11/* "/" */,-10 , 13/* "(" */,-10 , 14/* ")" */,-10 , 15/* "WS" */,-10 , 2/* "FTAG" */,-10 , 12/* "function" */,-10 , 8/* "{" */,-10 ),
	/* State 50 */ new Array( 9/* "}" */,-8 , 16/* "IDENTIFIER" */,-8 , 7/* ">" */,-8 , 4/* "/>" */,-8 , 6/* "->" */,-8 , 11/* "/" */,-8 , 13/* "(" */,-8 , 14/* ")" */,-8 , 15/* "WS" */,-8 , 2/* "FTAG" */,-8 , 12/* "function" */,-8 , 8/* "{" */,-8 ),
	/* State 51 */ new Array( 9/* "}" */,-7 , 16/* "IDENTIFIER" */,-7 , 7/* ">" */,-7 , 4/* "/>" */,-7 , 6/* "->" */,-7 , 11/* "/" */,-7 , 13/* "(" */,-7 , 14/* ")" */,-7 , 15/* "WS" */,-7 , 2/* "FTAG" */,-7 , 12/* "function" */,-7 , 8/* "{" */,-7 ),
	/* State 52 */ new Array( 27/* "$" */,-4 , 16/* "IDENTIFIER" */,-4 , 15/* "WS" */,-4 , 7/* ">" */,-4 , 4/* "/>" */,-4 , 6/* "->" */,-4 , 11/* "/" */,-4 , 8/* "{" */,-4 , 9/* "}" */,-4 , 13/* "(" */,-4 , 14/* ")" */,-4 , 2/* "FTAG" */,-4 , 5/* "<" */,-4 , 12/* "function" */,-4 , 10/* "COMMENT" */,-4 , 3/* "</" */,-4 ),
	/* State 53 */ new Array( 27/* "$" */,-35 , 16/* "IDENTIFIER" */,-35 , 15/* "WS" */,-35 , 7/* ">" */,-35 , 4/* "/>" */,-35 , 6/* "->" */,-35 , 11/* "/" */,-35 , 8/* "{" */,-35 , 9/* "}" */,-35 , 13/* "(" */,-35 , 14/* ")" */,-35 , 2/* "FTAG" */,-35 , 5/* "<" */,-35 , 12/* "function" */,-35 , 10/* "COMMENT" */,-35 , 3/* "</" */,-35 ),
	/* State 54 */ new Array( 3/* "</" */,-51 , 16/* "IDENTIFIER" */,-51 , 15/* "WS" */,-51 , 7/* ">" */,-51 , 4/* "/>" */,-51 , 6/* "->" */,-51 , 11/* "/" */,-51 , 8/* "{" */,-51 , 9/* "}" */,-51 , 13/* "(" */,-51 , 14/* ")" */,-51 , 2/* "FTAG" */,-51 , 5/* "<" */,-51 , 12/* "function" */,-51 , 10/* "COMMENT" */,-51 ),
	/* State 55 */ new Array( 8/* "{" */,-13 , 16/* "IDENTIFIER" */,-13 , 7/* ">" */,-13 , 4/* "/>" */,-13 , 6/* "->" */,-13 , 11/* "/" */,-13 , 13/* "(" */,-13 , 14/* ")" */,-13 , 15/* "WS" */,-13 , 2/* "FTAG" */,-13 , 12/* "function" */,-13 ),
	/* State 56 */ new Array( 3/* "</" */,-49 , 16/* "IDENTIFIER" */,-49 , 15/* "WS" */,-49 , 7/* ">" */,-49 , 4/* "/>" */,-49 , 6/* "->" */,-49 , 11/* "/" */,-49 , 8/* "{" */,-49 , 9/* "}" */,-49 , 13/* "(" */,-49 , 14/* ")" */,-49 , 2/* "FTAG" */,-49 , 5/* "<" */,-49 , 12/* "function" */,-49 , 10/* "COMMENT" */,-49 ),
	/* State 57 */ new Array( 14/* ")" */,10 , 13/* "(" */,11 , 9/* "}" */,12 , 8/* "{" */,13 , 11/* "/" */,14 , 6/* "->" */,15 , 4/* "/>" */,16 , 7/* ">" */,17 , 15/* "WS" */,18 , 16/* "IDENTIFIER" */,19 , 3/* "</" */,-48 , 2/* "FTAG" */,-48 , 5/* "<" */,-48 , 12/* "function" */,-48 , 10/* "COMMENT" */,-48 ),
	/* State 58 */ new Array( 16/* "IDENTIFIER" */,61 ),
	/* State 59 */ new Array( 8/* "{" */,49 , 16/* "IDENTIFIER" */,51 , 9/* "}" */,62 , 7/* ">" */,25 , 4/* "/>" */,26 , 6/* "->" */,27 , 11/* "/" */,28 , 13/* "(" */,29 , 14/* ")" */,30 , 15/* "WS" */,31 , 2/* "FTAG" */,32 , 12/* "function" */,33 ),
	/* State 60 */ new Array( 16/* "IDENTIFIER" */,23 , 8/* "{" */,63 , 7/* ">" */,25 , 4/* "/>" */,26 , 6/* "->" */,27 , 11/* "/" */,28 , 13/* "(" */,29 , 14/* ")" */,30 , 15/* "WS" */,31 , 2/* "FTAG" */,32 , 12/* "function" */,33 ),
	/* State 61 */ new Array( 7/* ">" */,64 ),
	/* State 62 */ new Array( 9/* "}" */,-9 , 16/* "IDENTIFIER" */,-9 , 7/* ">" */,-9 , 4/* "/>" */,-9 , 6/* "->" */,-9 , 11/* "/" */,-9 , 13/* "(" */,-9 , 14/* ")" */,-9 , 15/* "WS" */,-9 , 2/* "FTAG" */,-9 , 12/* "function" */,-9 , 8/* "{" */,-9 ),
	/* State 63 */ new Array( 9/* "}" */,-10 , 16/* "IDENTIFIER" */,-10 , 7/* ">" */,-10 , 4/* "/>" */,-10 , 6/* "->" */,-10 , 11/* "/" */,-10 , 13/* "(" */,-10 , 14/* ")" */,-10 , 15/* "WS" */,-10 , 2/* "FTAG" */,-10 , 12/* "function" */,-10 , 8/* "{" */,-10 ),
	/* State 64 */ new Array( 27/* "$" */,-36 , 16/* "IDENTIFIER" */,-36 , 15/* "WS" */,-36 , 7/* ">" */,-36 , 4/* "/>" */,-36 , 6/* "->" */,-36 , 11/* "/" */,-36 , 8/* "{" */,-36 , 9/* "}" */,-36 , 13/* "(" */,-36 , 14/* ")" */,-36 , 2/* "FTAG" */,-36 , 5/* "<" */,-36 , 12/* "function" */,-36 , 10/* "COMMENT" */,-36 , 3/* "</" */,-36 ),
	/* State 65 */ new Array( 8/* "{" */,49 , 16/* "IDENTIFIER" */,51 , 9/* "}" */,66 , 7/* ">" */,25 , 4/* "/>" */,26 , 6/* "->" */,27 , 11/* "/" */,28 , 13/* "(" */,29 , 14/* ")" */,30 , 15/* "WS" */,31 , 2/* "FTAG" */,32 , 12/* "function" */,33 ),
	/* State 66 */ new Array( 3/* "</" */,-50 , 16/* "IDENTIFIER" */,-50 , 15/* "WS" */,-50 , 7/* ">" */,-50 , 4/* "/>" */,-50 , 6/* "->" */,-50 , 11/* "/" */,-50 , 8/* "{" */,-50 , 9/* "}" */,-50 , 13/* "(" */,-50 , 14/* ")" */,-50 , 2/* "FTAG" */,-50 , 5/* "<" */,-50 , 12/* "function" */,-50 , 10/* "COMMENT" */,-50 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 18/* TOP */,1 , 17/* CONTENT */,2 ),
	/* State 1 */ new Array(  ),
	/* State 2 */ new Array( 20/* XML */,5 , 19/* TEXT */,6 ),
	/* State 3 */ new Array(  ),
	/* State 4 */ new Array( 21/* ARGS */,9 ),
	/* State 5 */ new Array(  ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array( 17/* CONTENT */,20 ),
	/* State 8 */ new Array( 24/* INTAG */,21 ),
	/* State 9 */ new Array( 23/* NONBRACKET */,22 ),
	/* State 10 */ new Array(  ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array(  ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array(  ),
	/* State 17 */ new Array(  ),
	/* State 18 */ new Array(  ),
	/* State 19 */ new Array(  ),
	/* State 20 */ new Array( 20/* XML */,5 , 19/* TEXT */,6 ),
	/* State 21 */ new Array( 26/* NONGT */,35 ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array( 22/* FUNCTIONBODY */,46 ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array(  ),
	/* State 28 */ new Array(  ),
	/* State 29 */ new Array(  ),
	/* State 30 */ new Array(  ),
	/* State 31 */ new Array(  ),
	/* State 32 */ new Array(  ),
	/* State 33 */ new Array(  ),
	/* State 34 */ new Array(  ),
	/* State 35 */ new Array(  ),
	/* State 36 */ new Array(  ),
	/* State 37 */ new Array( 25/* INXMLCONTENT */,48 ),
	/* State 38 */ new Array(  ),
	/* State 39 */ new Array(  ),
	/* State 40 */ new Array(  ),
	/* State 41 */ new Array(  ),
	/* State 42 */ new Array(  ),
	/* State 43 */ new Array(  ),
	/* State 44 */ new Array(  ),
	/* State 45 */ new Array(  ),
	/* State 46 */ new Array( 23/* NONBRACKET */,50 ),
	/* State 47 */ new Array(  ),
	/* State 48 */ new Array( 20/* XML */,56 , 19/* TEXT */,57 ),
	/* State 49 */ new Array( 22/* FUNCTIONBODY */,59 ),
	/* State 50 */ new Array(  ),
	/* State 51 */ new Array(  ),
	/* State 52 */ new Array(  ),
	/* State 53 */ new Array(  ),
	/* State 54 */ new Array(  ),
	/* State 55 */ new Array( 21/* ARGS */,60 ),
	/* State 56 */ new Array(  ),
	/* State 57 */ new Array(  ),
	/* State 58 */ new Array(  ),
	/* State 59 */ new Array( 23/* NONBRACKET */,50 ),
	/* State 60 */ new Array( 23/* NONBRACKET */,22 ),
	/* State 61 */ new Array(  ),
	/* State 62 */ new Array(  ),
	/* State 63 */ new Array( 22/* FUNCTIONBODY */,65 ),
	/* State 64 */ new Array(  ),
	/* State 65 */ new Array( 23/* NONBRACKET */,50 ),
	/* State 66 */ new Array(  )
);



/* Symbol labels */
var labels = new Array(
	"TOP'" /* Non-terminal symbol */,
	"WHITESPACE" /* Terminal symbol */,
	"FTAG" /* Terminal symbol */,
	"</" /* Terminal symbol */,
	"/>" /* Terminal symbol */,
	"<" /* Terminal symbol */,
	"->" /* Terminal symbol */,
	">" /* Terminal symbol */,
	"{" /* Terminal symbol */,
	"}" /* Terminal symbol */,
	"COMMENT" /* Terminal symbol */,
	"/" /* Terminal symbol */,
	"function" /* Terminal symbol */,
	"(" /* Terminal symbol */,
	")" /* Terminal symbol */,
	"WS" /* Terminal symbol */,
	"IDENTIFIER" /* Terminal symbol */,
	"CONTENT" /* Non-terminal symbol */,
	"TOP" /* Non-terminal symbol */,
	"TEXT" /* Non-terminal symbol */,
	"XML" /* Non-terminal symbol */,
	"ARGS" /* Non-terminal symbol */,
	"FUNCTIONBODY" /* Non-terminal symbol */,
	"NONBRACKET" /* Non-terminal symbol */,
	"INTAG" /* Non-terminal symbol */,
	"INXMLCONTENT" /* Non-terminal symbol */,
	"NONGT" /* Non-terminal symbol */,
	"$" /* Terminal symbol */
);


	
	info.offset = 0;
	info.src = src;
	info.att = new String();
	
	if( !err_off )
		err_off	= new Array();
	if( !err_la )
	err_la = new Array();
	
	sstack.push( 0 );
	vstack.push( 0 );
	
	la = __lex( info );
			
	while( true )
	{
		act = 68;
		for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
		{
			if( act_tab[sstack[sstack.length-1]][i] == la )
			{
				act = act_tab[sstack[sstack.length-1]][i+1];
				break;
			}
		}

		/*
		_print( "state " + sstack[sstack.length-1] + " la = " + la + " info.att = >" +
				info.att + "< act = " + act + " src = >" + info.src.substr( info.offset, 30 ) + "..." + "<" +
					" sstack = " + sstack.join() );
		*/
		
		if( _dbg_withtrace && sstack.length > 0 )
		{
			__dbg_print( "\nState " + sstack[sstack.length-1] + "\n" +
							"\tLookahead: " + labels[la] + " (\"" + info.att + "\")\n" +
							"\tAction: " + act + "\n" + 
							"\tSource: \"" + info.src.substr( info.offset, 30 ) + ( ( info.offset + 30 < info.src.length ) ?
									"..." : "" ) + "\"\n" +
							"\tStack: " + sstack.join() + "\n" +
							"\tValue stack: " + vstack.join() + "\n" );
			
			if( _dbg_withstepbystep )
				__dbg_wait();
		}
		
			
		//Panic-mode: Try recovery when parse-error occurs!
		if( act == 68 )
		{
			if( _dbg_withtrace )
				__dbg_print( "Error detected: There is no reduce or shift on the symbol " + labels[la] );
			
			err_cnt++;
			err_off.push( info.offset - info.att.length );			
			err_la.push( new Array() );
			for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
				err_la[err_la.length-1].push( labels[act_tab[sstack[sstack.length-1]][i]] );
			
			//Remember the original stack!
			var rsstack = new Array();
			var rvstack = new Array();
			for( var i = 0; i < sstack.length; i++ )
			{
				rsstack[i] = sstack[i];
				rvstack[i] = vstack[i];
			}
			
			while( act == 68 && la != 27 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery\n" +
									"Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
									"Action: " + act + "\n\n" );
				if( la == -1 )
					info.offset++;
					
				while( act == 68 && sstack.length > 0 )
				{
					sstack.pop();
					vstack.pop();
					
					if( sstack.length == 0 )
						break;
						
					act = 68;
					for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
					{
						if( act_tab[sstack[sstack.length-1]][i] == la )
						{
							act = act_tab[sstack[sstack.length-1]][i+1];
							break;
						}
					}
				}
				
				if( act != 68 )
					break;
				
				for( var i = 0; i < rsstack.length; i++ )
				{
					sstack.push( rsstack[i] );
					vstack.push( rvstack[i] );
				}
				
				la = __lex( info );
			}
			
			if( act == 68 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery failed, terminating parse process..." );
				break;
			}


			if( _dbg_withtrace )
				__dbg_print( "\tError recovery succeeded, continuing" );
		}
		
		/*
		if( act == 68 )
			break;
		*/
		
		
		//Shift
		if( act > 0 )
		{
			//Parse tree generation
			if( _dbg_withparsetree )
			{
				var node = new treenode();
				node.sym = labels[ la ];
				node.att = info.att;
				node.child = new Array();
				tree.push( treenodes.length );
				treenodes.push( node );
			}
			
			if( _dbg_withtrace )
				__dbg_print( "Shifting symbol: " + labels[la] + " (" + info.att + ")" );
		
			sstack.push( act );
			vstack.push( info.att );
			
			la = __lex( info );
			
			if( _dbg_withtrace )
				__dbg_print( "\tNew lookahead symbol: " + labels[la] + " (" + info.att + ")" );
		}
		//Reduce
		else
		{		
			act *= -1;
			
			if( _dbg_withtrace )
				__dbg_print( "Reducing by producution: " + act );
			
			rval = void(0);
			
			if( _dbg_withtrace )
				__dbg_print( "\tPerforming semantic action..." );
			
switch( act )
{
	case 0:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 1:
	{
		 output = vstack[ vstack.length - 1 ]; 
	}
	break;
	case 2:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 3:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 4:
	{
		 rval = vstack[ vstack.length - 6 ] + makeFunction(vstack[ vstack.length - 5 ] + vstack[ vstack.length - 4 ] + vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]); 
	}
	break;
	case 5:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 6:
	{
		 rval = ""; 
	}
	break;
	case 7:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 8:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 9:
	{
		rval = vstack[ vstack.length - 4 ];
	}
	break;
	case 10:
	{
		 rval = ""; 
	}
	break;
	case 11:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 12:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 13:
	{
		 rval = ""; 
	}
	break;
	case 14:
	{
		rval = vstack[ vstack.length - 0 ];
	}
	break;
	case 15:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 16:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 17:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 18:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 19:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 20:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 21:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 22:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 23:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 24:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 25:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 26:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 27:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 28:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 29:
	{
		rval = vstack[ vstack.length - 2 ];
	}
	break;
	case 30:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 31:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 32:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 33:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 34:
	{
		 rval = ""; 
	}
	break;
	case 35:
	{
		 rval = vstack[ vstack.length - 5 ] + vstack[ vstack.length - 4 ] + vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 36:
	{
		 rval = vstack[ vstack.length - 7 ] + vstack[ vstack.length - 6 ] + vstack[ vstack.length - 5 ] + vstack[ vstack.length - 4 ] + vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 37:
	{
		 rval = vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 38:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 39:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 40:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 41:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 42:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 43:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 44:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 45:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 46:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 47:
	{
		 rval = ""; 
	}
	break;
	case 48:
	{
		 rval = vstack[ vstack.length - 2 ] + makeTextNode(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 49:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 50:
	{
		 rval = vstack[ vstack.length - 6 ] + makeFunction(vstack[ vstack.length - 5 ] + vstack[ vstack.length - 4 ] + vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]); 
	}
	break;
	case 51:
	{
		 rval = vstack[ vstack.length - 2 ]; 
	}
	break;
	case 52:
	{
		 rval = ""; 
	}
	break;
}


			
			if( _dbg_withparsetree )
				tmptree = new Array();

			if( _dbg_withtrace )
				__dbg_print( "\tPopping " + pop_tab[act][1] + " off the stack..." );
				
			for( var i = 0; i < pop_tab[act][1]; i++ )
			{
				if( _dbg_withparsetree )
					tmptree.push( tree.pop() );
					
				sstack.pop();
				vstack.pop();
			}
									
			go = -1;
			for( var i = 0; i < goto_tab[sstack[sstack.length-1]].length; i+=2 )
			{
				if( goto_tab[sstack[sstack.length-1]][i] == pop_tab[act][0] )
				{
					go = goto_tab[sstack[sstack.length-1]][i+1];
					break;
				}
			}
			
			if( _dbg_withparsetree )
			{
				var node = new treenode();
				node.sym = labels[ pop_tab[act][0] ];
				node.att = new String();
				node.child = tmptree.reverse();
				tree.push( treenodes.length );
				treenodes.push( node );
			}
			
			if( act == 0 )
				break;
				
			if( _dbg_withtrace )
				__dbg_print( "\tPushing non-terminal " + labels[ pop_tab[act][0] ] );
				
			sstack.push( go );
			vstack.push( rval );			
		}
	}

	if( _dbg_withtrace )
		__dbg_print( "\nParse complete." );

	if( _dbg_withparsetree )
	{
		if( err_cnt == 0 )
		{
			__dbg_print( "\n\n--- Parse tree ---" );
			__dbg_parsetree( 0, treenodes, tree );
		}
		else
		{
			__dbg_print( "\n\nParse tree cannot be viewed. There where parse errors." );
		}
	}
	
	return err_cnt;
}


function __dbg_parsetree( indent, nodes, tree )
{
	var str = new String();
	for( var i = 0; i < tree.length; i++ )
	{
		str = "";
		for( var j = indent; j > 0; j-- )
			str += "\t";
		
		str += nodes[ tree[i] ].sym;
		if( nodes[ tree[i] ].att != "" )
			str += " >" + nodes[ tree[i] ].att + "<" ;
			
		__dbg_print( str );
		if( nodes[ tree[i] ].child.length > 0 )
			__dbg_parsetree( indent + 1, nodes, nodes[ tree[i] ].child );
	}
}



	return {
		parse: function(str) {
			var error_cnt = 0; 
			var error_off = new Array(); 
			var error_la = new Array();
			if( ( error_cnt = __parse( str, error_off, error_la ) ) > 0 ) { 
				print("PreParse errors");
				for( i = 0; i < error_cnt; i++ ) {
					var lineInfo = countLines(str, error_off[i]);
					print("    error on line", lineInfo.lines + ", column:", lineInfo.column, "expecting \"" + error_la[i].join() + "\" near:", "\n" + lineInfo.line + "\n                              ^\n");
				}
			}
			return output;
		}
	};
}();


