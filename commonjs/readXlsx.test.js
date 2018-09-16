'use strict';

var _readXlsx = require('./readXlsx');

describe('readXlsx', function () {
	it('should drop empty rows', function () {
		(0, _readXlsx.dropEmptyRows)([[null, null, null], ['A', 'B', 'C'], [null, 'D', null], [null, null, null], ['E', 'F', 'G'], [null, null, null]]).should.deep.equal([['A', 'B', 'C'], [null, 'D', null], ['E', 'F', 'G']]);
	});

	it('should drop empty columns', function () {
		(0, _readXlsx.dropEmptyColumns)([[null, 'A', 'B', 'C', null, null], [null, 'D', null, null, null, null], [null, null, null, null, null, null], [null, null, 'E', 'F', 'G', null]]).should.deep.equal([['A', 'B', 'C', null], ['D', null, null, null], [null, null, null, null], [null, 'E', 'F', 'G']]);
	});

	it('should generate row map when dropping empty rows', function () {
		var rowMap = [];

		(0, _readXlsx.dropEmptyRows)([[null, null, null], ['A', 'B', 'C'], [null, 'D', null], [null, null, null], ['E', 'F', 'G']], rowMap).should.deep.equal([['A', 'B', 'C'], [null, 'D', null], ['E', 'F', 'G']]);

		rowMap.should.deep.equal([1, 2, 4]);
	});
});
//# sourceMappingURL=readXlsx.test.js.map