template (content::XMLP, x::Unit Number, y::Unit Number) {
  offsetX = state(Unit Number),
  offsetY = state(Unit Number),
  dragging = state(Unit Null),
  <div style-position="absolute" style-left="{x}" style-top="{y}">
    <f:on mousedown>
      add(offsetX, event.offsetX),
      add(offsetY, event.offsetY),
      add(dragging, null)
    </f:on>
    <f:each dragging as _>
      <span>
        <f:each offsetX as offsetX>
          <f:trigger UI.ui:mouseX ui.ui as mouseX>
            add(x, subtract mouseX offsetX)
          </f:trigger>
        </f:each>
        <f:each offsetY as offsetY>
          <f:trigger UI.ui:mouseY ui.ui as mouseY>
            add(y, subtract mouseY offsetY)
          </f:trigger>
        </f:each>
        <f:trigger reactiveNot (UI.ui:mouseDown ui.ui) as _>
          remove(offsetX),
          remove(offsetY),
          remove(dragging)
        </f:trigger>
      </span>
    </f:each>
    <f:call>content</f:call>
  </div>
}