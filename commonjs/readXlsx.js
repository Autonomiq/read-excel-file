'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = readXlsx;
exports.dropEmptyRows = dropEmptyRows;
exports.dropEmptyColumns = dropEmptyColumns;

var _parseDate = require('./parseDate');

var _parseDate2 = _interopRequireDefault(_parseDate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var namespaces = {
  a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

  // Maps "A1"-like coordinates to `{ row, column }` numeric coordinates.
};var letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

/**
 * Reads an (unzipped) XLSX file structure into a 2D array of cells.
 * @param  {object} contents - A list of XML files inside XLSX file (which is a zipped directory).
 * @param  {number?} options.sheet - Workbook sheet id (`1` by default).
 * @param  {string?} options.dateFormat - Date format, e.g. "MM/DD/YY". Values having this format template set will be parsed as dates.
 * @param  {object} contents - A list of XML files inside XLSX file (which is a zipped directory).
 * @return {object} An object of shape `{ data, cells, properties }`. `data: string[][]` is an array of rows, each row being an array of cell values. `cells: string[][]` is an array of rows, each row being an array of cells. `properties: object` is the spreadsheet properties (e.g. whether date epoch is 1904 instead of 1900).
 */
function readXlsx(contents, xml) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  // Deprecated 1.0.0 `sheet` argument. Will be removed in some next major release.
  if (typeof options === 'string' || typeof options === 'number') {
    options = { sheet: options };
  } else if (!options.sheet) {
    options = _extends({}, options, { sheet: 1 });
  }

  var sheet = void 0;
  var properties = void 0;

  if (!contents['xl/worksheets/sheet' + options.sheet + '.xml']) {
    throw new Error('Sheet "' + options.sheet + '" not found in *.xlsx file.');
  }

  try {
    var values = parseValues(contents['xl/sharedStrings.xml'], xml);
    var styles = parseStyles(contents['xl/styles.xml'], xml);
    var _properties = parseProperties(contents['xl/workbook.xml'], xml);
    sheet = parseSheet(contents['xl/worksheets/sheet' + options.sheet + '.xml'], xml, values, styles, _properties, options);
  } catch (error) {
    // Guards against malformed XLSX files.
    console.error(error);
    if (options.schema) {
      return {
        data: [],
        properties: {}
      };
    }
    return [];
  }

  var _sheet$dimensions = _slicedToArray(sheet.dimensions, 2),
      leftTop = _sheet$dimensions[0],
      rightBottom = _sheet$dimensions[1];

  var cols = rightBottom.column - leftTop.column + 1;
  var rows = rightBottom.row - leftTop.row + 1;

  var cells = [];

  times(rows, function () {
    var row = [];
    times(cols, function () {
      return row.push({ value: null });
    });
    cells.push(row);
  });

  for (var _iterator = sheet.cells, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var cell = _ref;

    var row = cell.row - leftTop.row;
    var column = cell.column - leftTop.column;
    if (cells[row]) {
      cells[row][column] = cell;
    }
  }

  var data = cells.map(function (row) {
    return row.map(function (cell) {
      return cell.value;
    });
  });
  data = dropEmptyRows(dropEmptyColumns(data), options.rowMap);

  // cells = dropEmptyRows(dropEmptyColumns(cells, _ => _.value), options.rowMap, _ => _.value)

  if (options.schema) {
    return {
      data: data,
      properties: properties
    };
  }

  return data;
}

function calculateDimensions(cells) {
  var comparator = function comparator(a, b) {
    return a - b;
  };
  var allRows = cells.map(function (cell) {
    return cell.row;
  }).sort(comparator);
  var allCols = cells.map(function (cell) {
    return cell.column;
  }).sort(comparator);
  var minRow = allRows[0];
  var maxRow = allRows[allRows.length - 1];
  var minCol = allCols[0];
  var maxCol = allCols[allCols.length - 1];

  return [{ row: minRow, column: minCol }, { row: maxRow, column: maxCol }];
}

function times(n, action) {
  var i = 0;
  while (i < n) {
    action();
    i++;
  }
}

function colToInt(col) {
  col = col.trim().split('');

  var n = 0;

  for (var i = 0; i < col.length; i++) {
    n *= 26;
    n += letters.indexOf(col[i]);
  }

  return n;
}

function CellCoords(coords) {
  coords = coords.split(/(\d+)/);
  return {
    row: parseInt(coords[1]),
    column: colToInt(coords[0])
  };
}

function Cell(cellNode, sheet, xml, values, styles, properties, options) {
  var coords = CellCoords(cellNode.getAttribute('r'));

  var value = xml.select(sheet, cellNode, 'a:v', namespaces)[0];
  // For `xpath` `value` can be `undefined` while for native `DOMParser` it's `null`.
  value = value && value.textContent;

  // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/ST_CellType.html
  switch (cellNode.getAttribute('t')) {
    case 's':
      value = values[parseInt(value)] ? values[parseInt(value)].trim() : ''; //It was breaking due to value = undefined
      if (value === '') {
        value = undefined;
      }
      break;

    case 'b':
      value = value === '1' ? true : false;
      break;

    case 'n':
    // Default type is "n".
    // http://www.datypic.com/sc/ooxml/t-ssml_CT_Cell.html
    default:
      if (value === undefined) {
        break;
      }
      value = parseFloat(value);
      // XLSX has no specific format for dates.
      // Sometimes a date can be heuristically detected.
      // https://github.com/catamphetamine/read-excel-file/issues/3#issuecomment-395770777
      var style = styles[parseInt(cellNode.getAttribute('s') || 0)];
      if (style.numberFormat.id >= 14 && style.numberFormat.id <= 22 || style.numberFormat.id >= 45 && style.numberFormat.id <= 47 || options.dateFormat && style.numberFormat.template === options.dateFormat || options.smartDateParser !== false && style.numberFormat.template && isDateTemplate(style.numberFormat.template)) {
        value = (0, _parseDate2.default)(value, properties);
      }
      break;
  }

  // Convert empty values to `null`.
  if (value === undefined) {
    value = null;
  }

  return {
    row: coords.row,
    column: coords.column,
    value: value
  };
}

function dropEmptyRows(data, rowMap) {
  var accessor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (_) {
    return _;
  };

  // Fill in row map.
  if (rowMap) {
    var j = 0;
    while (j < data.length) {
      rowMap[j] = j;
      j++;
    }
  }
  // Drop empty rows.
  var i = data.length - 1;
  while (i >= 0) {
    // Check if the row is empty.
    var empty = true;
    for (var _iterator2 = data[i], _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref2 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref2 = _i2.value;
      }

      var cell = _ref2;

      if (accessor(cell) !== null) {
        empty = false;
        break;
      }
    }
    // Remove the empty row.
    if (empty) {
      data.splice(i, 1);
      if (rowMap) {
        rowMap.splice(i, 1);
      }
    }
    i--;
  }
  return data;
}

function dropEmptyColumns(data) {
  var accessor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (_) {
    return _;
  };

  var i = data[0].length - 1;
  while (i >= 0) {
    var empty = true;
    for (var _iterator3 = data, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        _ref3 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        _ref3 = _i3.value;
      }

      var row = _ref3;

      if (accessor(row[i]) !== null) {
        empty = false;
        break;
      }
    }
    if (empty) {
      var j = 0;
      while (j < data.length) {
        data[j].splice(i, 1);
        j++;
      }
    }
    i--;
  }
  return data;
}

function parseSheet(content, xml, values, styles, properties, options) {
  var sheet = xml.createDocument(content);

  var cells = xml.select(sheet, null, '/a:worksheet/a:sheetData/a:row/a:c', namespaces).map(function (node) {
    return Cell(node, sheet, xml, values, styles, properties, options);
  });

  var dimensions = xml.select(sheet, null, '//a:dimension/@ref', namespaces)[0];
  if (dimensions) {
    dimensions = dimensions.textContent.split(':').map(CellCoords);
  } else {
    dimensions = calculateDimensions(cells);
  }

  return { cells: cells, dimensions: dimensions };
}

function parseValues(content, xml) {
  var strings = xml.createDocument(content);
  return xml.select(strings, null, '//a:si', namespaces).map(function (string) {
    return xml.select(strings, string, './/a:t[not(ancestor::a:rPh)]', namespaces).map(function (_) {
      return _.textContent;
    }).join('');
  });
}

// http://officeopenxml.com/SSstyles.php
function parseStyles(content, xml) {
  if (!content) {
    return {};
  }
  // https://social.msdn.microsoft.com/Forums/sqlserver/en-US/708978af-b598-45c4-a598-d3518a5a09f0/howwhen-is-cellstylexfs-vs-cellxfs-applied-to-a-cell?forum=os_binaryfile
  // https://www.office-forums.com/threads/cellxfs-cellstylexfs.2163519/
  var doc = xml.createDocument(content);
  var baseStyles = xml.select(doc, null, '//a:styleSheet/a:cellStyleXfs/a:xf', namespaces).map(parseCellStyle);
  var numFmts = xml.select(doc, null, '//a:styleSheet/a:numFmts/a:numFmt', namespaces).map(parseNumberFormatStyle).reduce(function (formats, format) {
    formats[format.id] = format;
    return formats;
  }, []);

  return xml.select(doc, null, '//a:styleSheet/a:cellXfs/a:xf', namespaces).map(function (xf) {
    if (xf.hasAttribute('xfId')) {
      return _extends({}, baseStyles[xf.xfId], parseCellStyle(xf, numFmts));
    }
    return parseCellStyle(xf, numFmts);
  });
}

function parseNumberFormatStyle(numFmt) {
  return {
    id: numFmt.getAttribute('numFmtId'),
    template: numFmt.getAttribute('formatCode')
  };
}

// http://www.datypic.com/sc/ooxml/e-ssml_xf-2.html
function parseCellStyle(xf, numFmts) {
  var style = {};
  if (xf.hasAttribute('numFmtId')) {
    var numberFormatId = xf.getAttribute('numFmtId');
    if (numFmts[numberFormatId]) {
      style.numberFormat = numFmts[numberFormatId];
    } else {
      style.numberFormat = { id: numberFormatId };
    }
  }
  return style;
}

function parseProperties(content, xml) {
  if (!content) {
    return {};
  }
  var book = xml.createDocument(content);
  // http://webapp.docx4java.org/OnlineDemo/ecma376/SpreadsheetML/workbookPr.html
  var workbookProperties = xml.select(book, null, '//a:workbookPr', namespaces)[0];
  if (!workbookProperties) {
    return {};
  }
  var properties = {};
  // https://support.microsoft.com/en-gb/help/214330/differences-between-the-1900-and-the-1904-date-system-in-excel
  if (workbookProperties.getAttribute('date1904') === '1') {
    properties.epoch1904 = true;
  }
  return properties;
}

function isDateTemplate(template) {
  var tokens = template.split(/\W+/);
  for (var _iterator4 = tokens, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
    var _ref4;

    if (_isArray4) {
      if (_i4 >= _iterator4.length) break;
      _ref4 = _iterator4[_i4++];
    } else {
      _i4 = _iterator4.next();
      if (_i4.done) break;
      _ref4 = _i4.value;
    }

    var token = _ref4;

    if (['MM', 'DD', 'YY', 'YYYY'].indexOf(token) < 0) {
      return false;
    }
  }
  return true;
}
//# sourceMappingURL=readXlsx.js.map