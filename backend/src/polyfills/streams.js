// Alias for the `streams` npm package (used by iconv-lite) which simply re-exports Node.js stream.
// Needed because esbuild can't initialize the npm `streams` package inside CF Workers.
module.exports = require('stream');
