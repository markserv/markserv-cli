const fs = require('fs');
const path = require('path');

const Horseman = require('node-horseman');
const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger for testing
	// '-l', 'OFF'
	// '-p', '8889',
	// '-l', 'TRACE'
];

const fileStates = [
	'<html><body><h1>Test 1</h1></body></html>',
	'<html><body><h2>Test 2</h2></body></html>'
];

const horseman = new Horseman();

const writeState = index => {
	fs.writeFileSync('./partials/test.html', fileStates[index], err => {
		if (err) {
			return console.error(err);
		}
	});
};

const expectedHtml1 = fs.readFileSync(path.join(__dirname, 'expected1.html'), 'utf8');
const expectedHtml2 = fs.readFileSync(path.join(__dirname, 'expected2.html'), 'utf8');

writeState(0);

describe('single modifier', () => {
	it('should initialize', function (done) {
		this.timeout(10000);

		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			expect(markserv.initialized).to.be.a('boolean');
			expect(markserv.initialized).to.equal(true);
			expect(markserv.MarkconfJs).to.be.an('object');

			horseman
			.userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
			.open('http://localhost:8000/partials/test.html')
			.wait(100)
			.evaluate(function () {
				return document.getElementsByTagName('body')[0].innerHTML;
			})
			.then(function (actualHtml1) {
				expect(expectedHtml1).to.equal(actualHtml1);
				writeState(1);
			})
			.wait(500)
			.evaluate(function () {
				return document.getElementsByTagName('body')[0].innerHTML;
			})
			.then(function (actualHtml2) {
				expect(expectedHtml2).to.equal(actualHtml2);
				expect(actualHtml2).to.equal(expectedHtml2);
				done();
			})
			.close();
		});
	});
});
