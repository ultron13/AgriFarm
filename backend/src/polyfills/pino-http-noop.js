// CF Workers pino-http stub — returns a no-op Express middleware.
module.exports = function pinoHttp() {
  return function(_req, _res, next) { next(); };
};
module.exports.default = module.exports;
