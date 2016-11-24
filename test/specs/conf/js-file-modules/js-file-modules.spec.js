const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
  // Use the Markconf file from this spec directory
  '-c', __dirname,
  // Turn off the logger
  '-l', 'OFF'
];

describe('Markconf with includer single string', () => {
  it('should initialize with 1 includer (also requires 1 modifier)', done => {
    require('app/markserv.js')(argv).then(markserv => {
      // console.log(markserv);

      // should initialize
      expect(markserv.isInitialized).to.be.a('boolean');
      expect(markserv.isInitialized).to.equal(true);
      expect(markserv.Markconf).to.be.an('object');

     // should have plugins includers object'
      expect(markserv.Markconf.includers).to.be.an('object');
      expect(markserv.Markconf.plugins.includers).to.be.an('object');

     // should have plugins modifiers object'
      expect(markserv.Markconf.modifiers).to.be.an('object');
      expect(markserv.Markconf.plugins.modifiers).to.be.an('object');

      // should have a includers html and modifiers ** pattern array
      expect(markserv.Markconf.plugins.includers.html).to.be.an('object');
      expect(markserv.Markconf.plugins.modifiers['**/*.*']).to.be.an('object');

      // should load the modifier: `markserv-contrib-inc.html`
      const htmlIncluder = markserv.Markconf.plugins.includers.html;
      expect(htmlIncluder.name).to.equal('html');
      expect(htmlIncluder.htmlCommentIncluder).to.be.a('function');

      const fileModifier = markserv.Markconf.plugins.modifiers['**/*.*'];
      expect(fileModifier.name).to.equal('**/*.*');
      expect(fileModifier.httpResponseModifier).to.be.a('function');

      markserv.kill();

      done();
    });
  });
});
