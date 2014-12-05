template() {

  debug = action() {
    extract allNotes as note {
      debugNote (fetch (getPosition note allNotes))
    }
  },

  debugNote = jsaction(noteIndex::Number)::Void {
    var note = document.getElementById(noteIndex+"");

    var s = "";
    for(var i=0; i<note.childNodes.length; i++) {
      var child = note.childNodes[i];

      var k = child.getUserData('mark');
      if(k || k===0)
        s += k;

      s += '<';
      s += child.textContent;
      s += '>';
    }
    console.debug(s);
  },

  // ====================================================
  // State
  // ====================================================

  sourceTextRangeS = state(Unit TextRange),
  sourceTextRange = fetch sourceTextRangeS,

  targetTextRangeS = state(Unit TextRange),
  targetTextRange = fetch targetTextRangeS,

  selectedNoteS = state(Unit Note),
  selectedNote = fetch selectedNoteS,


  // ====================================================
  // UI and Ontology
  // ====================================================

  // returns (success, noteIndex, start, length)
  getSelection = jsaction()::(Bool, Number, Number, Number) {
    var range = window.getSelection().getRangeAt(0);

    // find common ancestor note, if there is one:
    var note = range.commonAncestorContainer;
    while(def(note) && note.className!=='note')
      note = note.parentNode;

    if(!def(note))
      return makeTuple(false, 0, 0, 0);

    var k = 0, start, end;
    for (var i=0; i<note.childNodes.length; i++) {
      var child = note.childNodes[i];
      if (child===range.startContainer)
        start = k + range.startOffset;
      if (child===range.endContainer)
        end = k + range.endOffset;
      if (child.nodeType === Node.TEXT_NODE)
        k += child.length;
      // else if (child.tagName === 'br')
      //   k += 1;
    }
    return makeTuple(true, parseInt(note.id), start, end-start);
  },

  setText = jsaction(noteIndex::Number, text::String)::Void {
    var note = document.getElementById(noteIndex+"");

    // clear note:
    while(note.lastChild)
      note.removeChild(note.lastChild);

    // insert text, one character/marker pair at a time:
    for (var i=0; i<text.length; i++) {
      // var mark = document.createElement('span');
      // mark.className = 'mark';
      var mark = document.createTextNode(text.charAt(i));
      mark.setUserData('mark',i,null);
      // mark.title = ""+i;
      // mark.appendChild(document.createTextNode(text.charAt(i)));
      // mark.textContent = text.charAt(i);
      note.appendChild(mark);
    }
  },

  updateText = jsaction(noteIndex::Number)::(String, [(Number, Number)]) {
    var note = document.getElementById(noteIndex+"");

    var text = "", d = 0;
    var shifts = [];
    for (var i = 0; i < note.childNodes.length; i++) {
      var child = note.childNodes[i];

      var k = child.getUserData('mark');
      if (k || k===0) {
        var mark = parseInt(k);
        var newD = text.length-mark;
        if (newD !== d) {
          d = newD;
          shifts.push(makeTuple(mark, d));
          console.debug(mark);
          console.debug(d);
        }
      }

      text += child.textContent;
    }
    return makeTuple(text, makeList(shifts));
  },

  initText = action(note::Note) {
    setText (fetch (getPosition note allNotes)) (fetch (note_text note))
  },

  updateNote = action(note::Note) {
    textShifts <- updateText (fetch (getPosition note allNotes)),
    text = fst textShifts,
    shifts = snd textShifts,
    note_setText note text shifts
  },

  createSelectedTextRange = action()::Unit TextRange {
    maybeRange <- create(Unit TextRange),
    sel <- getSelection,
    success = tuple4get1 sel,
    extract boolToUnit success as _ {
      note = fetch (getByPosition (tuple4get2 sel) allNotes),
      textRange <- createTextRange note,
      textRange_setRange textRange (makeRange (tuple4get3 sel) (tuple4get4 sel)),
      set maybeRange textRange
    },
    return maybeRange
  },

  linkRanges = action()::Void {
    linkText (makeTextLink sourceTextRange targetTextRange),
    unset sourceTextRangeS,
    unset targetTextRangeS
  },


  // ====================================================
  // Utility
  // ====================================================

  indexOf = function(s::String, sub::String)::Number {
    return s.indexOf(sub);
  },
  strlen = function(s::String)::Number {
    return s.length;
  },
  substr = function(s::String, start::Number, length::Number)::String {
    return s.substr(start,length);
  },
  debugNumber = jsaction(x::Number)::Void {
    console.debug(x);
  },
  debugString = jsaction(s::String)::Void {
    console.debug(s);
  },

  textRange_text = compose note_text textRange_note,
  textRange_start = textRange -> mapUnit range_start (textRange_range textRange),
  textRange_length = textRange -> mapUnit range_length (textRange_range textRange),

  textRangeString0 = textRange -> mapUnit3 substr (textRange_text textRange) (textRange_start textRange) (textRange_length textRange),
  textRangeString = textRange -> reactiveIfThen (textRangeString0 textRange) (textRangeString0 textRange) (textRange_text textRange),



  <div>
    <div style-background="#ffa">
      <f:on click>
        note <- createNote,
        note_setText note "Type note here." nil
      </f:on>
      Where's note!
    </div>
    <div style-background="#faa">
      <f:on mousedown>
        maybeRange <- createSelectedTextRange,
        set sourceTextRangeS (fetch maybeRange),
        linkRanges
      </f:on>
      Set source.
    </div>
    <div style-background="#afa">
      <f:on mousedown>
        maybeRange <- createSelectedTextRange,
        set targetTextRangeS (fetch maybeRange),
        linkRanges
      </f:on>
      Set target.
    </div>
    <div style-background="#aaf">
      <f:on mousedown>
        debug
      </f:on>
      Debug.
    </div>

    <f:each allNotes as note>

      <div style-border="solid 1px">

        <f:each boolToUnit (equal note (textRange_note sourceTextRange)) as _>
          <div style-background="#faa">source: {textRangeString sourceTextRange}</div>
        </f:each>
        <f:each boolToUnit (equal note (textRange_note targetTextRange)) as _>
          <div style-background="#afa">target: {textRangeString targetTextRange}</div>
        </f:each>

        <f:each note_text note as _>
          <f:wrapper>
            <f:on init>
              initText note
            </f:on>
            <div class="note" id="{getPosition note allNotes}" style-background="#ffc" contentEditable="true" />
          </f:wrapper>
        </f:each>

        <div style-background="#ffa">
          <f:on click>
            updateNote note
          </f:on>
          Save.
        </div>

        <f:each note_linksToNotes note as link>
          <div>
            <span style-background="#fcc">{textRangeString (textLink_source link)}</span>
            :-
            <span style-background="#cfc">{textRangeString (textLink_target link)}</span>
          </div>
        </f:each>

        <f:each note_linksFromNotes note as link>
          <div>
            <span style-background="#cfc">{textRangeString (textLink_target link)}</span>
            -:
            <span style-background="#fcc">{textRangeString (textLink_source link)}</span>
          </div>
        </f:each>
      </div>
    </f:each>
  </div>
}
