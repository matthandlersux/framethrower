template () {
  makeCoverUrl = function (id::String)::String {
    return "url(http:/"+"/media.eversplosion.com/video/"+id+"/cover.jpg)";
  },
  <div style-padding="40">
    <div class="movieselector">
      <em>Welcome to Framethrower Lite!</em><br />
      <p>a collaborative space to talk about film</p>
      To get started, choose a movie:<br /><br />
    </div>
    <f:each allMovies as movie>

      <div class="movieselector-image" style-float="left" style-width="140" style-height="180" style-opacity="{reactiveIfThen (isOpen movie) 0.5 1}" style-cursor="pointer">
        <f:on click>
          openMovie movie
        </f:on>
        <div class="zBackground" style-background-repeat="no-repeat" style-position="relative" style-width="96" style-height="140" style-background-image="{makeCoverUrl (Movie:id movie)}">

        </div>
        <f:call>tooltipInfo (Movie:title movie)</f:call>
        //{Movie:title movie}
      </div>
    </f:each>
    <div style-clear="both" />
  </div>
}