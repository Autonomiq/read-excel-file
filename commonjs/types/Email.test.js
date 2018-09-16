'use strict';

var _Email = require('./Email');

describe('Email', function () {
	it('should validate an Email', function () {
		(0, _Email.isEmail)('123').should.equal(false);
		(0, _Email.isEmail)('vladimir.putin@kremlin.ru').should.equal(true);
	});
});
//# sourceMappingURL=Email.test.js.map