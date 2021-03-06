const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger for testing
	'-l', 'OFF'
];

describe('Markconf with modifier array containing strings', () => {
	it('should initialize', done => {
		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			// should initialize
			expect(markserv.initialized).to.be.a('boolean');
			expect(markserv.initialized).to.equal(true);

			// should have plugins modifiers object
			expect(markserv.plugins).to.be.an('object');
			expect(markserv.plugins.modifiers).to.be.an('object');

			// should have a modifiers pattern array
			expect(markserv.plugins.modifiers['**/*.*']).to.be.an('array');
			expect(markserv.plugins.modifiers['**/*.*'].length).to.be.greaterThan(1);

			// should load the modifier: `markserv-contrib-mod.file`
			const fileModifierA = markserv.plugins.modifiers['**/*.*'][0];
			expect(fileModifierA.name).to.equal('markserv-contrib-mod.file');
			expect(fileModifierA.handle).to.be.a('function');

			// should load the modifier: `markserv-contrib-mod.dir`
			const fileModifierB = markserv.plugins.modifiers['**/*.*'][1];
			expect(fileModifierB.name).to.equal('markserv-contrib-mod.dir');
			expect(fileModifierB.handle).to.be.a('function');

			markserv.shutdown(markserv, done);
		});
	});
});
