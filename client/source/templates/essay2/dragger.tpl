template (init::Unit Number, setValue::Number -> Number -> Action a) {
  dragStart = state(Unit Number),
  startS = state(Unit Number),
  <f:wrapper>
    <f:on mousedown>
      extract init as i {
        set dragStart event.mouseX,
        set startS i
      }
    </f:on>
    <f:each dragStart as from>
      start = fetch startS,
      <f:wrapper>
        <f:on globalmouseup>
          unset dragStart
        </f:on>
        <f:on globalmousemove>
          setValue start (subtract event.mouseX from)
        </f:on>
      </f:wrapper>
    </f:each>
  </f:wrapper>
}