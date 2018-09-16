import { isURL } from './URL';

describe('URL', function () {
	it('should validate a URL', function () {
		isURL('123').should.equal(false);
		isURL('https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url').should.equal(true);
	});
});
//# sourceMappingURL=URL.test.js.map