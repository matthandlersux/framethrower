
// fetch will never actually be called (it gets factored out in the initial transformation), we just need it to be properly typed
addFun("fetch", "Unit a -> a", emptyFunction, 1);
addFun("unfetch", "a -> Unit a", emptyFunction, 1);
