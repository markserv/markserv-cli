const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger for testing
	'-l', 'OFF'
	// '-l', 'TRACE'
];

describe('Markconf using js strings (without extensions)', () => {
	it('should initialize with 1 includer and 1 modifier)', done => {
		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			// should initialize
			expect(markserv.initialized).to.be.a('boolean');
			expect(markserv.initialized).to.equal(true);
			expect(markserv.MarkconfJs).to.be.an('object');

			// should have plugins includers object'
			expect(markserv.plugins.includers).to.be.an('object');

			// should have plugins modifiers object'
			expect(markserv.plugins.modifiers).to.be.an('object');

			// should have a includers html and modifiers ** pattern array
			expect(markserv.plugins.includers.html).to.be.an('object');
			expect(markserv.plugins.modifiers['**/*.*']).to.be.an('object');

			// should load the modifier: `markserv-contrib-inc.html`
			const htmlIncluder = markserv.plugins.includers.html;
			expect(htmlIncluder.name).to.equal('custom-includer');
			expect(htmlIncluder.htmlCommentIncluder).to.be.a('function');

			const fileModifier = markserv.plugins.modifiers['**/*.*'];
			expect(fileModifier.name).to.equal('custom-modifier');
			expect(fileModifier.handle).to.be.a('function');

			markserv.shutdown(markserv, done);
		});
	});
});
