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
			return 15;

		do
		{

switch( state )
{
	case 0:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 44 ) || info.src.charCodeAt( pos ) == 46 || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 3;
		else if( info.src.charCodeAt( pos ) == 45 ) state = 10;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 13;
		else state = -1;
		break;

	case 1:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 2:
		if( info.src.charCodeAt( pos ) == 47 ) state = 6;
		else if( info.src.charCodeAt( pos ) == 102 ) state = 9;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 5:
		state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 7:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 8:
		state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 9:
		if( info.src.charCodeAt( pos ) == 58 ) state = 14;
		else state = -1;
		break;

	case 10:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 4;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 11:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 12:
		if( info.src.charCodeAt( pos ) == 10 ) state = 11;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 9 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 254 ) ) state = 12;
		else state = -1;
		break;

	case 13:
		if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 46 ) || ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 1;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 5;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 15;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 14:
		if( info.src.charCodeAt( pos ) == 62 ) state = 8;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 14;
		else state = -1;
		break;

	case 15:
		if( info.src.charCodeAt( pos ) == 10 ) state = 7;
		else if( info.src.charCodeAt( pos ) == 60 || info.src.charCodeAt( pos ) == 62 || info.src.charCodeAt( pos ) == 94 ) state = 12;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 9 ) || ( info.src.charCodeAt( pos ) >= 11 && info.src.charCodeAt( pos ) <= 59 ) || info.src.charCodeAt( pos ) == 61 || ( info.src.charCodeAt( pos ) >= 63 && info.src.charCodeAt( pos ) <= 93 ) || ( info.src.charCodeAt( pos ) >= 95 && info.src.charCodeAt( pos ) <= 254 ) ) state = 15;
		else state = -1;
		match = 8;
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
	new Array( 10/* TOP */, 1 ),
	new Array( 9/* CONTENT */, 2 ),
	new Array( 9/* CONTENT */, 2 ),
	new Array( 9/* CONTENT */, 0 ),
	new Array( 11/* TEXT */, 2 ),
	new Array( 11/* TEXT */, 2 ),
	new Array( 11/* TEXT */, 2 ),
	new Array( 11/* TEXT */, 2 ),
	new Array( 11/* TEXT */, 0 ),
	new Array( 12/* XML */, 5 ),
	new Array( 12/* XML */, 7 ),
	new Array( 12/* XML */, 3 ),
	new Array( 13/* INTAG */, 2 ),
	new Array( 13/* INTAG */, 2 ),
	new Array( 13/* INTAG */, 0 ),
	new Array( 14/* INXMLCONTENT */, 2 ),
	new Array( 14/* INXMLCONTENT */, 2 ),
	new Array( 14/* INXMLCONTENT */, 0 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 15/* "$" */,-4 , 8/* "IDENTIFIER" */,-4 , 7/* ">" */,-4 , 4/* "/>" */,-4 , 6/* "->" */,-4 , 2/* "FTAG" */,-4 , 5/* "<" */,-4 ),
	/* State 1 */ new Array( 15/* "$" */,0 ),
	/* State 2 */ new Array( 2/* "FTAG" */,5 , 5/* "<" */,6 , 15/* "$" */,-1 , 8/* "IDENTIFIER" */,-9 , 7/* ">" */,-9 , 4/* "/>" */,-9 , 6/* "->" */,-9 ),
	/* State 3 */ new Array( 15/* "$" */,-3 , 8/* "IDENTIFIER" */,-3 , 7/* ">" */,-3 , 4/* "/>" */,-3 , 6/* "->" */,-3 , 2/* "FTAG" */,-3 , 5/* "<" */,-3 , 3/* "</" */,-3 ),
	/* State 4 */ new Array( 6/* "->" */,7 , 4/* "/>" */,8 , 7/* ">" */,9 , 8/* "IDENTIFIER" */,10 , 15/* "$" */,-2 , 2/* "FTAG" */,-2 , 5/* "<" */,-2 , 3/* "</" */,-2 ),
	/* State 5 */ new Array( 3/* "</" */,-4 , 8/* "IDENTIFIER" */,-4 , 7/* ">" */,-4 , 4/* "/>" */,-4 , 6/* "->" */,-4 , 2/* "FTAG" */,-4 , 5/* "<" */,-4 ),
	/* State 6 */ new Array( 7/* ">" */,-15 , 4/* "/>" */,-15 , 8/* "IDENTIFIER" */,-15 , 6/* "->" */,-15 ),
	/* State 7 */ new Array( 15/* "$" */,-8 , 8/* "IDENTIFIER" */,-8 , 7/* ">" */,-8 , 4/* "/>" */,-8 , 6/* "->" */,-8 , 2/* "FTAG" */,-8 , 5/* "<" */,-8 , 3/* "</" */,-8 ),
	/* State 8 */ new Array( 15/* "$" */,-7 , 8/* "IDENTIFIER" */,-7 , 7/* ">" */,-7 , 4/* "/>" */,-7 , 6/* "->" */,-7 , 2/* "FTAG" */,-7 , 5/* "<" */,-7 , 3/* "</" */,-7 ),
	/* State 9 */ new Array( 15/* "$" */,-6 , 8/* "IDENTIFIER" */,-6 , 7/* ">" */,-6 , 4/* "/>" */,-6 , 6/* "->" */,-6 , 2/* "FTAG" */,-6 , 5/* "<" */,-6 , 3/* "</" */,-6 ),
	/* State 10 */ new Array( 15/* "$" */,-5 , 8/* "IDENTIFIER" */,-5 , 7/* ">" */,-5 , 4/* "/>" */,-5 , 6/* "->" */,-5 , 2/* "FTAG" */,-5 , 5/* "<" */,-5 , 3/* "</" */,-5 ),
	/* State 11 */ new Array( 3/* "</" */,13 , 2/* "FTAG" */,5 , 5/* "<" */,6 , 8/* "IDENTIFIER" */,-9 , 7/* ">" */,-9 , 4/* "/>" */,-9 , 6/* "->" */,-9 ),
	/* State 12 */ new Array( 6/* "->" */,14 , 8/* "IDENTIFIER" */,15 , 7/* ">" */,16 , 4/* "/>" */,17 ),
	/* State 13 */ new Array( 8/* "IDENTIFIER" */,18 ),
	/* State 14 */ new Array( 7/* ">" */,-14 , 4/* "/>" */,-14 , 8/* "IDENTIFIER" */,-14 , 6/* "->" */,-14 ),
	/* State 15 */ new Array( 7/* ">" */,-13 , 4/* "/>" */,-13 , 8/* "IDENTIFIER" */,-13 , 6/* "->" */,-13 ),
	/* State 16 */ new Array( 3/* "</" */,-18 , 8/* "IDENTIFIER" */,-18 , 7/* ">" */,-18 , 4/* "/>" */,-18 , 6/* "->" */,-18 , 2/* "FTAG" */,-18 , 5/* "<" */,-18 ),
	/* State 17 */ new Array( 15/* "$" */,-12 , 8/* "IDENTIFIER" */,-12 , 7/* ">" */,-12 , 4/* "/>" */,-12 , 6/* "->" */,-12 , 2/* "FTAG" */,-12 , 5/* "<" */,-12 , 3/* "</" */,-12 ),
	/* State 18 */ new Array( 7/* ">" */,20 ),
	/* State 19 */ new Array( 3/* "</" */,23 , 2/* "FTAG" */,5 , 5/* "<" */,6 , 8/* "IDENTIFIER" */,-9 , 7/* ">" */,-9 , 4/* "/>" */,-9 , 6/* "->" */,-9 ),
	/* State 20 */ new Array( 15/* "$" */,-10 , 8/* "IDENTIFIER" */,-10 , 7/* ">" */,-10 , 4/* "/>" */,-10 , 6/* "->" */,-10 , 2/* "FTAG" */,-10 , 5/* "<" */,-10 , 3/* "</" */,-10 ),
	/* State 21 */ new Array( 3/* "</" */,-17 , 8/* "IDENTIFIER" */,-17 , 7/* ">" */,-17 , 4/* "/>" */,-17 , 6/* "->" */,-17 , 2/* "FTAG" */,-17 , 5/* "<" */,-17 ),
	/* State 22 */ new Array( 6/* "->" */,7 , 4/* "/>" */,8 , 7/* ">" */,9 , 8/* "IDENTIFIER" */,10 , 3/* "</" */,-16 , 2/* "FTAG" */,-16 , 5/* "<" */,-16 ),
	/* State 23 */ new Array( 8/* "IDENTIFIER" */,24 ),
	/* State 24 */ new Array( 7/* ">" */,25 ),
	/* State 25 */ new Array( 15/* "$" */,-11 , 8/* "IDENTIFIER" */,-11 , 7/* ">" */,-11 , 4/* "/>" */,-11 , 6/* "->" */,-11 , 2/* "FTAG" */,-11 , 5/* "<" */,-11 , 3/* "</" */,-11 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 10/* TOP */,1 , 9/* CONTENT */,2 ),
	/* State 1 */ new Array(  ),
	/* State 2 */ new Array( 12/* XML */,3 , 11/* TEXT */,4 ),
	/* State 3 */ new Array(  ),
	/* State 4 */ new Array(  ),
	/* State 5 */ new Array( 9/* CONTENT */,11 ),
	/* State 6 */ new Array( 13/* INTAG */,12 ),
	/* State 7 */ new Array(  ),
	/* State 8 */ new Array(  ),
	/* State 9 */ new Array(  ),
	/* State 10 */ new Array(  ),
	/* State 11 */ new Array( 12/* XML */,3 , 11/* TEXT */,4 ),
	/* State 12 */ new Array(  ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array( 14/* INXMLCONTENT */,19 ),
	/* State 17 */ new Array(  ),
	/* State 18 */ new Array(  ),
	/* State 19 */ new Array( 12/* XML */,21 , 11/* TEXT */,22 ),
	/* State 20 */ new Array(  ),
	/* State 21 */ new Array(  ),
	/* State 22 */ new Array(  ),
	/* State 23 */ new Array(  ),
	/* State 24 */ new Array(  ),
	/* State 25 */ new Array(  )
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
	"IDENTIFIER" /* Terminal symbol */,
	"CONTENT" /* Non-terminal symbol */,
	"TOP" /* Non-terminal symbol */,
	"TEXT" /* Non-terminal symbol */,
	"XML" /* Non-terminal symbol */,
	"INTAG" /* Non-terminal symbol */,
	"INXMLCONTENT" /* Non-terminal symbol */,
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
		act = 27;
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
		if( act == 27 )
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
			
			while( act == 27 && la != 15 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery\n" +
									"Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
									"Action: " + act + "\n\n" );
				if( la == -1 )
					info.offset++;
					
				while( act == 27 && sstack.length > 0 )
				{
					sstack.pop();
					vstack.pop();
					
					if( sstack.length == 0 )
						break;
						
					act = 27;
					for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
					{
						if( act_tab[sstack[sstack.length-1]][i] == la )
						{
							act = act_tab[sstack[sstack.length-1]][i+1];
							break;
						}
					}
				}
				
				if( act != 27 )
					break;
				
				for( var i = 0; i < rsstack.length; i++ )
				{
					sstack.push( rsstack[i] );
					vstack.push( rvstack[i] );
				}
				
				la = __lex( info );
			}
			
			if( act == 27 )
			{
				if( _dbg_withtrace )
					__dbg_print( "\tError recovery failed, terminating parse process..." );
				break;
			}


			if( _dbg_withtrace )
				__dbg_print( "\tError recovery succeeded, continuing" );
		}
		
		/*
		if( act == 27 )
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
		 rval = ""; 
	}
	break;
	case 5:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 6:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
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
		 rval = ""; 
	}
	break;
	case 10:
	{
		 rval = vstack[ vstack.length - 5 ] + vstack[ vstack.length - 4 ] + vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 11:
	{
		 rval = vstack[ vstack.length - 7 ] + vstack[ vstack.length - 6 ] + vstack[ vstack.length - 5 ] + vstack[ vstack.length - 4 ] + vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 12:
	{
		 rval = vstack[ vstack.length - 3 ] + vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 13:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 14:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 15:
	{
		 rval = ""; 
	}
	break;
	case 16:
	{
		 rval = vstack[ vstack.length - 2 ] + makeTextNode(vstack[ vstack.length - 1 ]); 
	}
	break;
	case 17:
	{
		 rval = vstack[ vstack.length - 2 ] + vstack[ vstack.length - 1 ]; 
	}
	break;
	case 18:
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


