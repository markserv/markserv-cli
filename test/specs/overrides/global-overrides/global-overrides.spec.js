const fs = require('fs');
const path = require('path');
const http = require('http');

const chalk = require('chalk');

const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger
	// '-l', 'trace'
	'-l', 'OFF'
];

describe('global overrides', () => {
	it('should make it through to templating', done => {
		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			// should initialize
			expect(markserv.initialized).to.be.a('boolean');
			expect(markserv.initialized).to.equal(true);
			expect(markserv.MarkconfJs).to.be.an('object');

			const expectedHtml = fs.readFileSync(path.join(__dirname, 'expected.html'), 'utf8');

			http.get({
				port: markserv.httpServer.port,
				path: '/'
			})
			.on('response', res => {
				res.setEncoding('utf8');
				res.on('data', data => {
					expect(data).to.equal(expectedHtml);
					markserv.shutdown(markserv, done);
				});
			})
			.on('error', err => {
				console.error(err);
				done();
			});
		});
	});
});
