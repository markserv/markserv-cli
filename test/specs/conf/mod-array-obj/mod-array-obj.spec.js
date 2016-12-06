const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger
	'-l', 'OFF'
	// '-l', 'TRACE'
];

describe('Markconf with modifier array containing single object', () => {
	// it('should initialize with 1 modifier', function (done) {
	it('should initialize with 1 modifier', done => {
		require('app/markserv')(argv).then(markserv => {
			console.log(markserv);

			// should initialize
			expect(markserv.isInitialized).to.be.a('boolean');
			expect(markserv.isInitialized).to.equal(true);

			// should have plugins modifiers object'
			expect(markserv.Markconf).to.be.an('object');
			expect(markserv.plugins).to.be.an('object');
			expect(markserv.plugins.modifiers).to.be.an('object');

			// should have a modifiers pattern array
			expect(markserv.plugins.modifiers['**/*.*']).to.be.an('array');
			expect(markserv.plugins.modifiers['**/*.*'].length).to.be.greaterThan(0);

			// should load the modifier: `markserv-contrib-mod.file`
			const dirModifier = markserv.plugins.modifiers['**/*.*'][0];
			expect(dirModifier.name).to.equal('markserv-contrib-mod.dir');
			expect(dirModifier.httpResponseModifier).to.be.a('function');

			expect(dirModifier.name).to.equal('markserv-contrib-mod.dir');

			// console.log(dirModifier);
			expect(dirModifier.markconfTemplatePath).to.be.a('string');
			expect(dirModifier.markconfTemplate).to.equal('<h1>test</h1>');

			markserv.kill(markserv);

			done();
		});
	});
});
