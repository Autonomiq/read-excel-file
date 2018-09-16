import { isInteger } from './Integer';

describe('Integer', function () {
	it('should validate an Integer', function () {
		isInteger('1.2').should.equal(false);
		isInteger('1').should.equal(true);
		isInteger(1.2).should.equal(false);
		isInteger(1).should.equal(true);
	});
});
//# sourceMappingURL=Integer.test.js.map