const fs = require('fs');
const path = require('path');
const http = require('http');

const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Can use custom port
	// '-p', '8889',
	'-r', path.join(__dirname, 'partials'),
	// Turn off the logger for testing
	// '-l', 'trace'
	'-l', 'OFF'
];

describe('mod-template-passthrough', () => {
	it('should be able to nest HTML levels deep', done => {
		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			// should initialize
			expect(markserv.initialized).to.be.a('boolean');
			expect(markserv.initialized).to.equal(true);
			expect(markserv.MarkconfJs).to.be.an('object');

			const expectedHtml = fs.readFileSync(path.join(__dirname, 'expected.html'), 'utf8');

			const web = http.get({
				port: markserv.httpServer.port,
				headers: {'Cache-Control': 'no-cache'}
			});

			function onResponse(res) {
				res.setEncoding('utf8');

				function onData(data) {
					expect(data).to.equal(expectedHtml);
					markserv.shutdown(markserv);
				}

				function onEnd() {
					res.removeListener('data', onData);
					res.removeListener('end', onEnd);
					done();
				}

				res.on('data', onData);
				res.on('end', onEnd);
			}

			web.on('response', onResponse);

			function webEnd() {
				web.removeListener('response', onResponse);
				web.removeListener('end', webEnd);
			}

			web.on('end', webEnd);
		});
	});
});
