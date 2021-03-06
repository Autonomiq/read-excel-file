'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = readXlsxFile;

var _unpackXlsxFileBrowser = require('./unpackXlsxFileBrowser');

var _unpackXlsxFileBrowser2 = _interopRequireDefault(_unpackXlsxFileBrowser);

var _xmlBrowser = require('./xmlBrowser');

var _xmlBrowser2 = _interopRequireDefault(_xmlBrowser);

var _readXlsxFileContents = require('./readXlsxFileContents');

var _readXlsxFileContents2 = _interopRequireDefault(_readXlsxFileContents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Reads XLSX file into a 2D array of cells in a browser.
 * @param  {file} file - A file being uploaded in the browser.
 * @param  {object?} options
 * @param  {string?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
function readXlsxFile(file) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return (0, _unpackXlsxFileBrowser2.default)(file).then(function (entries) {
    return (0, _readXlsxFileContents2.default)(entries, _xmlBrowser2.default, options);
  });
}
//# sourceMappingURL=readXlsxFileBrowser.js.map