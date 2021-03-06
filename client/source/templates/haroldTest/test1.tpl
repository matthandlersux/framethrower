template(b) {
  // do lambdas remember their environment? (no)
  w = x,
  x = 1,
  // y = _ -> x,
  x = 2,

  // does type-checking behave in the same way? (yes)
  // k = 1,
  // f = plus k k,
  // k = x -> x,

  // do free variables hide their environment? (yes)
  z = x -> x,

  s = state(Unit Null, null),

  <f:wrapper>
    <f:each s>
      // .. and do nested-looking environments actually nest? (yes)
      x = 3,
      a = 4,

      <div>
        {x}
        {a}
        {b}
        // {y 0} // this outputs 2
        {w} // this outputs 2
      </div>
    </f:each>

    <div>
      // {y 0} // this outputs 2
      {z 0} // this outputs 0
      {w} // this outputs 2
    </div>
  </f:wrapper>
}