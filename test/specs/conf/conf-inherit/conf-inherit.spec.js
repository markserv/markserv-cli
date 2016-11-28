const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
  // Use the Markconf file from this spec directory
  '-c', __dirname,
  // Turn off the logger
  '-l', 'trace'
  // '-l', 'OFF'
];

describe('Markconf should be able to inherit from Github app', () => {
  it('should initialize with github app modifiers and includers', done => {
    require('app/markserv')(argv).then(markserv => {
      // console.error(markserv);

      // should initialize
      expect(markserv.isInitialized).to.be.a('boolean');
      expect(markserv.isInitialized).to.equal(true);
      expect(markserv.Markconf).to.be.an('object');

      // should have plugins includers object
      expect(markserv.Markconf.plugins).to.be.an('object');
      expect(markserv.Markconf.plugins.includers).to.be.an('object');

      // // should have plugins modifiers object
      expect(markserv.Markconf.plugins).to.be.an('object');
      expect(markserv.Markconf.plugins.modifiers).to.be.an('object');

      // // should find a 404 modifier
      expect(markserv.Markconf.plugins.modifiers['404']).to.be.an('object');
      expect(markserv.Markconf.plugins.modifiers['404'].name).to.equal('markserv-contrib-mod.http-404');
      expect(markserv.Markconf.plugins.modifiers['404'].httpResponseModifier).to.be.a('function');

      // console.log(markserv.Markconf.plugins.includers);

      // should find an html indluder
      expect(markserv.Markconf.plugins.includers.html).to.be.an('object');
      expect(markserv.Markconf.plugins.includers.html.name).to.equal('markserv-contrib-inc.html');
      expect(markserv.Markconf.plugins.includers.html.htmlCommentIncluder).to.be.a('function');

      markserv.kill();

      done();
    });
  });
});
