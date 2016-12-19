const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger
	'-l', 'OFF'
];

describe('Markconf with modifier array containing single string', () => {
	it('should initialize with 1 modifier', done => {
		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			// should initialize
			expect(markserv.initialized).to.be.a('boolean');
			expect(markserv.initialized).to.equal(true);

			// should have plugins modifiers object'
			expect(markserv.plugins).to.be.an('object');
			expect(markserv.plugins.modifiers).to.be.an('object');

			// should have a modifiers pattern array
			expect(markserv.plugins.modifiers['**/*.*']).to.be.an('array');
			expect(markserv.plugins.modifiers['**/*.*'].length).to.be.greaterThan(0);

			// should load the modifier: `markserv-contrib-mod.file`
			const fileModifier = markserv.plugins.modifiers['**/*.*'][0];
			expect(fileModifier.name).to.equal('markserv-contrib-mod.file');
			expect(fileModifier.handle).to.be.a('function');

			markserv.shutdown(markserv);

			done();
		});
	});
});
