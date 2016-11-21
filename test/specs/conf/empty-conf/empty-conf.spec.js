const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
  // Use the Markconf file from this spec directory
  '-c', __dirname
];

describe('empty conf module', () => {
  it('fails to initialize', () => {
    const markserv = require('app/markserv.js')(argv);
    expect(markserv.isInitialized).to.be.a('boolean');
    expect(markserv.isInitialized).to.equal(false);
  });
});
