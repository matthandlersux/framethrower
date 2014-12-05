/*

An Object looks like:
{
  kind: "object",
  type: Type,
  origType: Type,
  prop: {propName:property}
}

*/


var classesToMake = {
  //DEBUG
  "TestClass": {
    prop: {
      "str": "Unit String",
      "num": "Unit Number",
      "staticString": "String"
    }
  },

  "OutlineNode": {
    prop: {
      "string": "Unit String",
      "children": "Set OutlineNode"
    }
  },


  // ====================================================
  // For Lite 1
  // ====================================================

  // TODO split into Movie and MovieData
  "Movie": {
    prop: {
      "id": "String",
      "title": "String",
      "duration": "Number",
      "aspectRatio": "Number",
      "chapters": "List ((Number, Number), String)",
      "_fromNotes": "Set ((Note, Unit (Number, Number)), (Movie, Unit (Number, Number)))" // Set TimeLink
    }
  },

  "Note": {
    prop: {
      "_owner": "String",
      "_isPublic": "Unit Null",
      "_text": "Unit String",
      "_toNotes": "Set ((Note, Unit (Number, Number)), (Note, Unit (Number, Number)))", // Set TextLink
      "_toMovies": "Set ((Note, Unit (Number, Number)), (Movie, Unit (Number, Number)))", // Set TimeLink
      "_fromNotes": "Set ((Note, Unit (Number, Number)), (Note, Unit (Number, Number)))" // Set TextLink
    }
  },


  // ====================================================
  // New
  // ====================================================

  "Situation": {
    prop: {
      "container": "Unit Situation",
      "contains": "Set Situation",
      "propName": "Unit String", // these prop*s will be refactored!
      "propTime": "Unit Number",
      "propVideo": "Unit ExtVideo",
      "propText": "Unit String",
      "asType": "Set Pipe",
      "asInstance": "Set Pipe"
    }
  },


  "Pipe": {
    prop: {
      "type": "Situation",
      "instance": "Situation",
      //"container": "Map Ord Pipe",
      "container": "Unit [Pipe]",
      "contains": "Set Pipe",
      "truth": "Unit Number"
    }
  },


  "ExtVideo": {
    prop: {
      "id": "String",
      "aspectRatio": "Number",
      "duration": "Number"
    }
  },




  "VideoTimeline": {
    prop: {
      "movie": "Situation",
      "zoomStart": "Unit Number",
      "zoomDuration": "Unit Number",
      "selectStart": "Unit Number",
      "selectDuration": "Unit Number",
      "previewTime": "Unit Number",
      "collapsed": "Unit Null",
      "scrubbing": "Unit Null",
      "playing": "Unit Null"
    }
  },

  "Popup": {
    prop: {
      "content": "XMLP",
      "x": "Number",
      "y": "Number",
      "direction": "Number", // 0 = horizontal, 1 = vertical
      "width": "Number",
      "height": "Number" // this should be treated as minimum height
    }
  },












  "TimeSelection": {
    prop: {
      "start": "Unit Number",
      "duration": "Unit Number"
    }
  },

  "Timeline": {
    prop: {
      "duration": "Number",
      "video": "Unit X.video"
    }
  },


  // ====================================================
  // SV (Situation View)
  // ====================================================
  "Position": {
    prop: {
      "x": "Unit Number",
      "y": "Unit Number"
    }
  },

  "ShapePosition": {
    prop: {
      "scale": "Unit Number",
      "position": "Position"
    }
  },

  "ChildProp": {
    prop: {
      "hidden": "Unit Null",
      "position": "Position",
      "scale": "Unit Number"
    }
  },









  // ====================================================
  // External Representations
  // ====================================================

  "X.video": {
    prop: {
      "url": "String",
      "width": "Number",
      "height": "Number",
      //"frameCount": "Number",
      "frameRate": "Number",
      "duration": "Number",
      "cuts": "Unit JSON",
      "cuts2": "Set Number"
    }
  },



  // ====================================================
  // UI
  // ====================================================

  "UI.ui": {
    prop: {
      "screenWidth": "Unit Number",
      "screenHeight": "Unit Number",
      "mouseX": "Unit Number",
      "mouseY": "Unit Number",
      "mouseDown": "Unit Null"
    }
  }



};

forEach(classesToMake, function (classDef, className) {
  objects.addClass(className, classDef);
});