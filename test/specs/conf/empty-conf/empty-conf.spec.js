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
    require('app/markserv')(argv).then(markserv => {
      // console.log(markserv);

      expect(markserv.isInitialized).to.be.a('boolean');
      expect(markserv.isInitialized).to.equal(false);

      // No httpService  is started, so we can't kill it
      // markserv.kill();
      expect(markserv.httpServer).to.equal(undefined);

      done();
    });
  });
});
