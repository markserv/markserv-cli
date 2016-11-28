const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
  // Use the Markconf file from this spec directory
  '-c', __dirname,
  // Turn off the logger
  '-l', 'OFF'
];

describe('non-empty Markconf', () => {
  it('should initialize', done => {
    require('app/markserv.js')(argv).then(markserv => {
      // console.log(markserv);

      expect(markserv.isInitialized).to.be.a('boolean');
      expect(markserv.isInitialized).to.equal(true);
      markserv.kill();

      done();
    });
  });
});
