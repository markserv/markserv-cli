const fs = require('fs');
const path = require('path');
const http = require('http');

const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger
	// '-l', 'trace'
	// '-p', '8889',
	'-l', 'OFF'
];

describe('Markconf with Markdown includer', () => {
	it('should be able to nest Markdown 4 levels deep', done => {
		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			// // should initialize
			expect(markserv.initialized).to.be.a('boolean');
			expect(markserv.initialized).to.equal(true);
			expect(markserv.MarkconfJs).to.be.an('object');

			const expectedHtml = fs.readFileSync(path.join(__dirname, 'expected.html'), 'utf8');

			http.get({port: markserv.httpServer.port}).on('response', res => {
				res.setEncoding('utf8');
				res.on('data', data => {
					// console.log(data);

					expect(data).to.equal(expectedHtml);

					markserv.shutdown(markserv);

					done();
				});
			});
		}).catch(err => {
			throw new Error(err);
		});
	});
});
