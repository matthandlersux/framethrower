template (header::XMLP, underFold::Null->XMLP) { // underFold is :: Null->XMLP because we're not lazy enough
  expanded = state(Unit Null),
  <div>
    <div class="header">
      <f:each expanded as _>
        <div class="outline-expanded">
          <f:on click>remove(expanded)</f:on>
        </div>
      </f:each>
      <f:each reactiveNot expanded as _>
        <div class="outline-collapsed">
          <f:on click>add(expanded, null)</f:on>
        </div>
      </f:each>
      <f:call>header</f:call>
    </div>
    <f:each expanded as _>
      <f:call>underFold null</f:call>
    </f:each>
  </div>
}