template () {

  // ========================================================================
  // Action Utility
  // ========================================================================

  makeNamedObject = action (name::String, type::Object) {
    object = create(Object),
    nameObject object name,
    typeObject object type
  },

  nameObject = action (object::Object, name::String) {
    nameText = create(X.text, {string: name}),
    makeOntProperty shared.name object (X.text~Object nameText)
  },

  thumbnailObject = action (object::Object, url::String, width::Number, height::Number) {
    pic = create(X.picture, {url:url, width:width, height:height}),
    makeOntProperty relation object pic
  },
  // relationTemplateObject TODO: needs to be JSON...

  typeObject = action (object::Object, type::Object) {
    makeOntProperty shared.isA object type
  },

  makeType = action (object::Object) {
    infon = makeInfon1 shared.isType object,
    makeTrueInOnt infon
  },

  makeOntProperty = action (relation::Object, arg1::Object, arg2::Object) {
    infon = makeInfon2 relation arg1 arg2,
    makeTrueInOnt infon
  },

  makeTrueInOnt = action (infon::Cons) {
    putObjectInSituation (Cons~Object infon) shared.ont
  },

  putObjectInSituation = action (object::Object, situation::Object) {
    infon = makeInfon2 shared.in situation object,
    add(Cons:truth infon, null)
  },

  makeCons = action (left::Object, right::Object) {
    cons = create(Cons, {left: left, right: right}),
    add(Object:upRight left, cons),
    add(Object:upLeft right, cons),
    cons
  },

  makeInfon1 = makeCons,
  makeInfon2 = action (relation::Object, arg1::Object, arg2::Object) {
    cons1 = makeCons relation arg1,
    makeCons (Cons~Object cons1) arg2
  },
  makeInfon3 = action (relation::Object, arg1::Object, arg2::Object, arg3::Object) {
    cons1 = makeCons relation arg1,
    cons2 = makeCons (Cons~Object cons1) arg2,
    makeCons (Cons~Object cons2) arg3
  },


  // ========================================================================
  // Prepare State
  // ========================================================================

  prepareState = action () {
    makeType shared.type,
    makeType shared.type.situation,
    makeType shared.type.entity,
    nameObject shared.type "Type",
    nameObject shared.type.situation "Situation",
    nameObject shared.type.entity "Entity",
    typeObject shared.type.situation shared.type,
    typeObject shared.type.entity shared.type,

    nameObject shared.ont "Ontological Layer",
    typeObject shared.ont shared.type.situation,
    nameObject shared.realLife "Real Life",
    typeObject shared.realLife shared.type.situation,

    nameObject shared.test.walleMovie "Wall-E",
    putObjectInSituation shared.test.walleMovie shared.realLife
  },

  <div>
    <f:on init>prepareState</f:on>
    Hello.
    <f:call>printObject shared.realLife</f:call>
    <div>
      <f:call>outline shared.realLife printObject getAllIn</f:call>
    </div>
    <div>
      <f:call>
        x = state(Unit Number),
        y = state(Unit Number),
        dragdrop (printObject shared.realLife) x y
      </f:call>
    </div>
  </div>
}