import { isEmail } from './Email';

describe('Email', function () {
	it('should validate an Email', function () {
		isEmail('123').should.equal(false);
		isEmail('vladimir.putin@kremlin.ru').should.equal(true);
	});
});
//# sourceMappingURL=Email.test.js.map