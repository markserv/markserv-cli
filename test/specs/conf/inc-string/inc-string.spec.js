const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger
	'-l', 'OFF'
	// '-l', 'TRACE'
];

describe('Markconf with includer single string', () => {
	it('should initialize with 1 includer (also requires 1 modifier)', done => {
		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			// // should initialize
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
			expect(htmlIncluder.name).to.equal('markserv-contrib-inc.html');
			expect(htmlIncluder.htmlCommentIncluder).to.be.a('function');

			markserv.shutdown(markserv, done);
		});
	});
});
