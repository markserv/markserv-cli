const path = require('path');
const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
  // Use the Markconf file from this spec directory
  '-c', __dirname,
  // Turn off the logger
  '-l', 'TRACE'
];

describe('Markconf should be able to inherit from Github app', () => {
  it('should initialize with github app modifiers and includers', done => {
    const markserv = require('app/markserv.js')(argv);

    // should initialize
    expect(markserv.isInitialized).to.be.a('boolean');
    expect(markserv.isInitialized).to.equal(true);
    expect(markserv.Markconf).to.be.an('object');

    console.log(markserv.Markconf.plugins);

    // should have plugins includers object
    // expect(markserv.Markconf.includers).to.be.an('object');
    // expect(markserv.Markconf.plugins.includers).to.be.an('object');

    // should have plugins modifiers object
    // expect(markserv.Markconf.modifiers).to.be.an('object');
    // expect(markserv.Markconf.plugins.modifiers).to.be.an('object');

    markserv.kill();

    done();
  });
});
