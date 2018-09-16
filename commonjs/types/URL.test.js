'use strict';

var _URL = require('./URL');

describe('URL', function () {
	it('should validate a URL', function () {
		(0, _URL.isURL)('123').should.equal(false);
		(0, _URL.isURL)('https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url').should.equal(true);
	});
});
//# sourceMappingURL=URL.test.js.map