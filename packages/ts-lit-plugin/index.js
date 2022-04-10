// A TypeScript compiler plugin must do a CJS style default export, but
// we can't express that in proper ESM, so this hand-written JS
// file bridges the difference.

// The rollup bundle is much smaller than the esbuild bundle, so
// use it. If we can't get the esbuild bundle smaller, we may set up a
// development build so that we can still have a fast edit/refresh.
module.exports = require("./lib/bundle-rollup").init;
