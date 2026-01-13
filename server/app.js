// Compatibility shim: re-export the main app from server.js so any
// accidental imports of `server/app.js` receive the correct Express
// application. This ensures deployments that reference `app.js` keep
// working while `server.js` is the canonical entry point.
module.exports = require("./server");
