template () {
  test = state(Unit Number),
  <div>
    <f:call>
      if test as hello {
        <div>Test has value: {hello}</div>
      } else {
        <div>Test has no value</div>
      }
    </f:call>
    <div>
      <f:on click>
        add(test, 77)
      </f:on>
      Change it!
    </div>
    <div>
      <f:on click>
        remove(test)
      </f:on>
      Remove it!
    </div>
  </div>
}