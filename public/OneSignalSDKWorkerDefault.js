// Browsers that already registered this file keep receiving push.
// New installs register /sw.js, which is the same worker.
importScripts('/sw.js');
