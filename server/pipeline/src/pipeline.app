{application, pipeline,
 [{description, "pipeline"},
  {vsn, "0.01"},
  {modules, [
    pipeline,
    pipeline_app,
    pipeline_sup,
    pipeline_web,
    pipeline_deps
  ]},
  {registered, []},
  {mod, {pipeline_app, []}},
  {env, []},
  {applications, [kernel, stdlib, crypto]}]}.
