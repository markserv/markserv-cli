const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
	// Use the Markconf file from this spec directory
	'-c', __dirname,
	// Turn off the logger for testing
	'-l', 'OFF'
	// '-l', 'TRACE'
];

describe('mod-array-obj', () => {
	// it('should initialize with 1 modifier', function (done) {
	it('should initialize with 1 modifier', done => {
		require('app/markserv')(argv).then(markserv => {
			// console.log(markserv);

			// should initialize
			expect(markserv.initialized).to.be.a('boolean');
			expect(markserv.initialized).to.equal(true);

			// should have plugins modifiers object'
			expect(markserv.MarkconfJs).to.be.an('object');
			expect(markserv.plugins).to.be.an('object');
			expect(markserv.plugins.modifiers).to.be.an('object');

			// should have a modifiers pattern array
			expect(markserv.plugins.modifiers['**/*.*']).to.be.an('array');
			expect(markserv.plugins.modifiers['**/*.*'].length).to.be.greaterThan(0);

			// should load the modifier: `markserv-contrib-mod.file`
			const dirModifier = markserv.plugins.modifiers['**/*.*'][0];
			expect(dirModifier.name).to.equal('markserv-contrib-mod.dir');
			expect(dirModifier.handle).to.be.a('function');

			expect(dirModifier.name).to.equal('markserv-contrib-mod.dir');

			// console.log(dirModifier);
			expect(dirModifier.configTemplateUrl).to.be.a('string');
			expect(dirModifier.configTemplate).to.equal('<h1>test</h1>');

			expect(dirModifier.pluginTemplateUrl).to.be.a('string');
			expect(dirModifier.pluginTemplate).to.equal('<h1>Index of {{dir}}</h1>\n\n<ul>\n  {{#files}}\n    <li class="{{class}}">\n      <a href="{{path}}">{{name}}</a>\n    </li>\n  {{/files}}\n</ul>\n');

			markserv.shutdown(markserv, done);
		}).catch(err => {
			console.log(err);
			throw new Error(err);
		});
	});
});
