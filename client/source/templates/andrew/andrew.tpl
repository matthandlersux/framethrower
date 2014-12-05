template () {

  // localCell1 = state {
  //   cell <- create(Unit String),
  //   set cell "andrew",
  //   return cell
  // },
  //
  // localCell2 = state {
  //   cell <- create(Unit String),
  //   return cell
  // },

  dummyDelete = action() {
    //ignore
  },

  <div>
    <f:on init>
      dummyDelete
    </f:on>
    <f:call>
      drawOutline root dummyDelete
    </f:call>
  </div>
}