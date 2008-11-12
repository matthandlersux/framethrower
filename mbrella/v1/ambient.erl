-module (ambient).
-compile (export_all).

processes can make their own boxes and endcaps, but they have to keep track of the endcaps they make
because when the box gets deactivated, it needs to deactivate the endcaps its created

essentially an ambient is just an object that keeps track of linked processes that need to deactivate all at the same time