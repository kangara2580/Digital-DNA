/**
 * Next.js 15.5+ dev: middleware.js is loaded via Node require() and starts with
 * webpack's `self["webpackChunk_N_E"]` bootstrap. Polyfill before Next boots.
 */
if (typeof globalThis.self === "undefined") {
  globalThis.self = globalThis;
}
