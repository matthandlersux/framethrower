template() {
  expressionTest = template() {
    x = [1,2,3,4],
    y = (head (tail [1,2,3,4]), head x),
    z = subtract (fst y) (snd y),
    <div>
    /expressionTest/
    expected: 1
    got: {z}
    </div>
  },

  templateTest = template() {
    x = template()::Number {2},
    y = template()::Number {x},
    z = template(x,y)::Number {plus x y},
    w = template() {
      <div>
      /templateTest/
      expected: 2
      got: {z (plus x y) (subtract 0 y)}
      </div>
    },
    <f:call>w</f:call>
  },

  jsFunctionTest = template() {
    x = 3,
    y = function(s::String)::Number {return env(s);},
    z = y "x",
    w = y "z",
    <div>
    /jsFunctionTest/
    expected: 3
    got: {w}
    </div>
  },

  jsActionTest = template() {
    x = "x",
    y = jsaction(s::String)::String {console.log(env(s)); return env(s);},
    <div>
      <f:on mousedown>
        z <- y x,
        y z
      </f:on>
    /jsActionTest/
    click to see in the console:<br/>x<br/>x
    </div>
  },

  // unitTest

  // setTest

  // mapTest

  // fetchTest

  // ifTest

  // actionIfTest

  // fonTest

  // feachTest

  // extractTest

  // svgTest

  // subTemplateTest

  <f:wrapper>
    <f:call>expressionTest</f:call>
    <f:call>templateTest</f:call>
    <f:call>jsFunctionTest</f:call>
    <f:call>jsActionTest</f:call>
  </f:wrapper>
}