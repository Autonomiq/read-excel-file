import convertToJson, { parseArray, getBlock } from './convertToJson';
import Integer from './types/Integer';
import URL from './types/URL';
import Email from './types/Email';

var date = convertToUTCTimezone(new Date(2018, 3 - 1, 24, 12));

describe('convertToJson', function () {
	it('should parse arrays', function () {
		getBlock('abc"de,f"g,h', ',', 0).should.deep.equal(['abcde,fg', 10]);
		parseArray(' abc"de,f"g  , h ').should.deep.equal(['abcde,fg', 'h']);
	});

	it('should convert to json', function () {
		var _convertToJson = convertToJson([['DATE', 'NUMBER', 'BOOLEAN', 'STRING', 'PHONE'], [new Date(Date.parse('03/24/2018') - new Date().getTimezoneOffset() * 60 * 1000 + 12 * 60 * 60 * 1000), // '43183', // '03/24/2018',
		'123', true, 'abc', '(123) 456-7890']], {
			DATE: {
				prop: 'date',
				type: Date
				// template: 'MM/DD/YYYY',
			},
			NUMBER: {
				prop: 'number',
				type: Number
			},
			BOOLEAN: {
				prop: 'boolean',
				type: Boolean
			},
			STRING: {
				prop: 'string',
				type: String
			},
			PHONE: {
				prop: 'phone',
				parse: function parse(value) {
					return '+11234567890';
				}
			}
		}),
		    rows = _convertToJson.rows,
		    errors = _convertToJson.errors;

		errors.should.deep.equal([]);

		rows[0].date = rows[0].date.toISOString();

		rows.should.deep.equal([{
			date: date.toISOString(),
			number: 123,
			phone: '+11234567890',
			boolean: true,
			string: 'abc'
		}]);
	});

	it('should require fields', function () {
		var _convertToJson2 = convertToJson([['NUMBER'], [null]], {
			NUMBER: {
				prop: 'number',
				type: Number,
				required: true
			}
		}),
		    rows = _convertToJson2.rows,
		    errors = _convertToJson2.errors;

		errors.should.deep.equal([{
			error: 'required',
			row: 1,
			column: 'NUMBER',
			type: Number,
			value: null
		}]);

		rows.should.deep.equal([]);
	});

	it('should parse arrays', function () {
		var _convertToJson3 = convertToJson([['NAMES'], ['Barack Obama, "String, with, colons", Donald Trump'], [null]], {
			NAMES: {
				prop: 'names',
				type: [String]
			}
		}),
		    rows = _convertToJson3.rows,
		    errors = _convertToJson3.errors;

		errors.should.deep.equal([]);

		rows.should.deep.equal([{
			names: ['Barack Obama', 'String, with, colons', 'Donald Trump']
		}]);
	});

	it('should parse integers', function () {
		var _convertToJson4 = convertToJson([['INTEGER'], ['1'], ['1.2']], {
			INTEGER: {
				prop: 'value',
				type: Integer
			}
		}),
		    rows = _convertToJson4.rows,
		    errors = _convertToJson4.errors;

		errors.length.should.equal(1);
		errors[0].row.should.equal(2);
		errors[0].column.should.equal('INTEGER');
		errors[0].error.should.equal('invalid');

		rows.should.deep.equal([{
			value: 1
		}]);
	});

	it('should parse URLs', function () {
		var _convertToJson5 = convertToJson([['URL'], ['https://kremlin.ru'], ['kremlin.ru']], {
			URL: {
				prop: 'value',
				type: URL
			}
		}),
		    rows = _convertToJson5.rows,
		    errors = _convertToJson5.errors;

		errors.length.should.equal(1);
		errors[0].row.should.equal(2);
		errors[0].column.should.equal('URL');
		errors[0].error.should.equal('invalid');

		rows.should.deep.equal([{
			value: 'https://kremlin.ru'
		}]);
	});

	it('should parse Emails', function () {
		var _convertToJson6 = convertToJson([['EMAIL'], ['vladimir.putin@kremlin.ru'], ['123']], {
			EMAIL: {
				prop: 'value',
				type: Email
			}
		}),
		    rows = _convertToJson6.rows,
		    errors = _convertToJson6.errors;

		errors.length.should.equal(1);
		errors[0].row.should.equal(2);
		errors[0].column.should.equal('EMAIL');
		errors[0].error.should.equal('invalid');

		rows.should.deep.equal([{
			value: 'vladimir.putin@kremlin.ru'
		}]);
	});

	it('should call .validate()', function () {
		var _convertToJson7 = convertToJson([['NAME'], ['George Bush']], {
			NAME: {
				prop: 'name',
				type: String,
				required: true,
				validate: function validate(value) {
					if (value === 'George Bush') {
						throw new Error('custom-error');
					}
				}
			}
		}),
		    rows = _convertToJson7.rows,
		    errors = _convertToJson7.errors;

		errors.should.deep.equal([{
			error: 'custom-error',
			row: 1,
			column: 'NAME',
			type: String,
			value: 'George Bush'
		}]);

		rows.should.deep.equal([]);
	});

	it('should validate numbers', function () {
		var _convertToJson8 = convertToJson([['NUMBER'], ['123abc']], {
			NUMBER: {
				prop: 'number',
				type: Number,
				required: true
			}
		}),
		    rows = _convertToJson8.rows,
		    errors = _convertToJson8.errors;

		errors.should.deep.equal([{
			error: 'invalid',
			row: 1,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}]);

		rows.should.deep.equal([]);
	});

	it('should validate booleans', function () {
		var _convertToJson9 = convertToJson([['TRUE', 'FALSE', 'INVALID'], [true, false, 'TRUE']], {
			TRUE: {
				prop: 'true',
				type: Boolean,
				required: true
			},
			FALSE: {
				prop: 'false',
				type: Boolean,
				required: true
			},
			INVALID: {
				prop: 'invalid',
				type: Boolean,
				required: true
			}
		}),
		    rows = _convertToJson9.rows,
		    errors = _convertToJson9.errors;

		errors.should.deep.equal([{
			error: 'invalid',
			row: 1,
			column: 'INVALID',
			type: Boolean,
			value: 'TRUE'
		}]);

		rows.should.deep.equal([{
			true: true,
			false: false
		}]);
	});

	it('should validate dates', function () {
		var _convertToJson10 = convertToJson([['DATE', 'INVALID'], [43183, // 03/24/2018',
		'-'], [date, // 03/24/2018',,
		'-']], {
			DATE: {
				prop: 'date',
				type: Date,
				// template: 'MM/DD/YYYY',
				required: true
			},
			INVALID: {
				prop: 'invalid',
				type: Date,
				// template: 'MM/DD/YYYY',
				required: true
			}
		}),
		    rows = _convertToJson10.rows,
		    errors = _convertToJson10.errors;

		errors.should.deep.equal([{
			error: 'invalid',
			row: 1,
			column: 'INVALID',
			type: Date,
			value: '-'
		}, {
			error: 'invalid',
			row: 2,
			column: 'INVALID',
			type: Date,
			value: '-'
		}]);

		rows.should.deep.equal([{
			date: date
		}, {
			date: date
		}]);
	});

	it('should throw parse() errors', function () {
		var _convertToJson11 = convertToJson([['PHONE'], ['123']], {
			PHONE: {
				prop: 'phone',
				parse: function parse() {
					throw new Error('invalid');
				}
			}
		}),
		    rows = _convertToJson11.rows,
		    errors = _convertToJson11.errors;

		errors.should.deep.equal([{
			error: 'invalid',
			row: 1,
			column: 'PHONE',
			value: '123'
		}]);

		rows.should.deep.equal([]);
	});

	it('should map row numbers', function () {
		var _convertToJson12 = convertToJson([['NUMBER'], ['123abc']], {
			NUMBER: {
				prop: 'number',
				type: Number
			}
		}, {
			rowMap: [2, 5]
		}),
		    rows = _convertToJson12.rows,
		    errors = _convertToJson12.errors;

		errors.should.deep.equal([{
			error: 'invalid',
			row: 6,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}]);
	});
});

// Converts timezone to UTC while preserving the same time
function convertToUTCTimezone(date) {
	// Doesn't account for leap seconds but I guess that's ok
	// given that javascript's own `Date()` does not either.
	// https://www.timeanddate.com/time/leap-seconds-background.html
	//
	// https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
	//
	return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
}
//# sourceMappingURL=convertToJson.test.js.map