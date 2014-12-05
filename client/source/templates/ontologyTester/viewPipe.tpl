template (pipe::Pipe) {
  <div>

    <f:call>linkToSit (Pipe:type pipe)</f:call>
    ->
    <f:call>linkToSit (Pipe:instance pipe)</f:call>

    <div style-marginLeft="10">
      <f:each Pipe:container pipe as containerList>
        <f:each containerList as container>
          <f:call>viewPipe container</f:call>
        </f:each>
      </f:each>
    </div>
  </div>
}