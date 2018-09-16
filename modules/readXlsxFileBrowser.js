import unpackXlsxFile from './unpackXlsxFileBrowser';
import xml from './xmlBrowser';
import readXlsxFileContents from './readXlsxFileContents';

/**
 * Reads XLSX file into a 2D array of cells in a browser.
 * @param  {file} file - A file being uploaded in the browser.
 * @param  {object?} options
 * @param  {string?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(file) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return unpackXlsxFile(file).then(function (entries) {
    return readXlsxFileContents(entries, xml, options);
  });
}
//# sourceMappingURL=readXlsxFileBrowser.js.map