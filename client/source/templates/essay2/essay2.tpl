template () {

  Position := (Number, Number),
  posX = fst,
  posY = snd,

  WidthHeight := (Number, Number),
  whWidth = fst,
  whHeight = snd,

  Tooltip := (Position, WidthHeight, Bool, XMLP),
  tooltipX = compose posX tuple4get1,
  tooltipY = compose posY tuple4get1,
  tooltipWidth = compose whWidth tuple4get2,
  tooltipHeight = compose whHeight tuple4get2,
  tooltipIsHorizontal = tuple4get3,
  tooltipContent = tuple4get4,

  showTooltip = action (x::Number, y::Number, width::Number, height::Number, isHorizontal::Bool, content::XMLP) {
    set tooltipS ((x, y), (width, height), isHorizontal, content)
  },
  hideTooltip = action () {
    unset tooltipS
  },


  // State

  tooltipS = state(Unit Tooltip),



  screenWidth = fetch (UI.ui:screenWidth ui.ui),
  screenHeight = fetch (UI.ui:screenHeight ui.ui),

  myTestContent = <div>hello</div>,

  <div style-width="100%" style-height="100%">
    // <f:on click>
    //       showTooltip 100 100 300 100 false myTestContent
    //     </f:on>

    <f:call>timeline</f:call>

    <f:call>tooltip</f:call>
  </div>
}