const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
  // Use the Markconf file from this spec directory
  '-c', __dirname
];

describe('non-empty Markconf', () => {
  it('should initialize', () => {
    const markserv = require('app/markserv.js')(argv);

    console.log(markserv);

    expect(markserv.isInitialized).to.be.a('boolean');
    expect(markserv.isInitialized).to.equal(true);
  });
});
