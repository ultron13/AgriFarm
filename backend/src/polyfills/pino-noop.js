// CF Workers pino stub — pino uses worker_threads/process internals that fail at bundle time.
// All logging goes through console in CF Workers (see lib/logger.ts).
function noop() {}
const logger = {
  info: (...a) => console.log(...a),
  warn: (...a) => console.warn(...a),
  error: (...a) => console.error(...a),
  debug: (...a) => console.debug(...a),
  fatal: (...a) => console.error(...a),
  trace: noop,
  child: () => logger,
  symbols: {},
  stdSerializers: {},
  stdTimeFunctions: {},
};
module.exports = function pino() { return logger; };
module.exports.symbols = {};
module.exports.stdSerializers = {};
module.exports.stdTimeFunctions = {};
module.exports.destination = noop;
module.exports.transport = noop;
module.exports.default = module.exports;
