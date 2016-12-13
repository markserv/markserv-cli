const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger
	'-l', 'OFF'
];

describe('empty Markconf', () => {
	it('should fail to initialize', done => {
		require('app/markserv')(argv)
		.catch(err => {
			expect(err).to.be.a('string');
			expect(err).to.equal('Plugins were not found in the Markconf file: \u001b[34m\u001b[4m/Users/al/ms/markserv-cli/test/specs/conf/empty-conf/Markconf.js\u001b[24m\u001b[39m.');
			done();
		});
	});
});
