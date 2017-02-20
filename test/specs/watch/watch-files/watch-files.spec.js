const fs = require('fs');
const path = require('path');
const http = require('http');

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
	'<h1>Test 1</h1>',
	'<h2>Test 2</h2>'
];

const horseman = new Horseman();

const writeState = index => {
	fs.writeFileSync('./partials/test.md', fileStates[index], err => {

		if (err) {
			return console.error(err);
		}
	});
};

writeState(0);

describe('single modifier', () => {
	it('should initialize', function(done) {
		this.timeout(10000);

		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			expect(markserv.initialized).to.be.a('boolean');
			expect(markserv.initialized).to.equal(true);
			expect(markserv.MarkconfJs).to.be.an('object');

			const expectedHtml1 = fs.readFileSync(path.join(__dirname, 'expected.html'), 'utf8');

			let html;

			horseman
				.userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
				.open('http://localhost:8003/partials/test.md')
				  .wait(5000)
				 .evaluate(function() {
				    return document.getElementsByTagName('body')[0].innerHTML;
				  })
				  .then(function(html1){
				    // Will log 'Hello World' after a roughly 100 ms delay.
				    console.log(html1);
					expect(html1).to.equal(expectedHtml1);
					writeState(1);
				  })
				  .wait(3000)
			      .evaluate(function() {
				    return document.getElementsByTagName('body')[0].innerHTML;
				  })
				  .then(function(html2){
				    // Will log 'Hello World' after a roughly 100 ms delay.
				    console.log(html2);
					// expect(html1).to.equal(expectedHtml1);
					done();
				  })
				  .close();


			// http.get({
			// 	port: markserv.httpServer.port,
			// 	path: '/partials/test.md'
			// })
			// .on('response', res => {
			// 	res.setEncoding('utf8');
			// 	res.on('data', data => {
			// 		// console.log(data);
			// 		// console.log(expectedHtml);
			// 		expect(data).to.equal(expectedHtml);

			// 		// setTimeout(() => {
			// 			writeState(1);
			// 			http.get({
			// 				port: markserv.httpServer.port,
			// 				path: '/partials/test.md'
			// 			})
			// 			.on('response', res => {
			// 				res.setEncoding('utf8');
			// 				res.on('data', data => {
			// 					console.log(data);
			// 				});
			// 			});
			// 		}, 400);

			// 		markserv.shutdown(markserv, done);
			// 	});
			// })
			// .on('error', err => {
			// 	console.error(err);
			// 	done();
			// });
		});
	});
});
