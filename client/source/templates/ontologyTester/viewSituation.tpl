template (sit::Situation) {
  <div style-marginBottom="10">
    <div>
      <b><f:call>linkToSit sit</f:call></b>
    </div>
    <div>
      <f:each Situation:propTime sit as propTime>
        <div>time: {propTime}</div>
      </f:each>
    </div>
    <div style-marginLeft="10">
      Parent:
      <f:each Situation:container sit as container>
        <f:call>linkToSit container</f:call>
      </f:each>
    </div>
    <f:call>
      header = <span>Children</span>,
      underFold = template (_::Null) {
        <div style-marginLeft="30">
          <f:each Situation:contains sit as child>
            viewSituation child
          </f:each>
        </div>
      },
      expandable header underFold
    </f:call>
    <div>
      Pipes (as Instance):
      <div style-marginLeft="20">
        <f:each Situation:asInstance sit as pipe>
          viewPipe pipe
        </f:each>
      </div>
    </div>
    <div>
      Pipes  (as Type):
      <div style-marginLeft="20">
        <f:each Situation:asType sit as pipe>
          viewPipe pipe
        </f:each>
      </div>
    </div>
  </div>
}