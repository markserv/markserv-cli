const chaiAsPromised = require('chai-as-promised');
const chai = require('chai').use(chaiAsPromised);
const help = require('./test/helpers/loadHelpers.js');
const expect = chai.expect;

const filterArgs = require('./filterArgs');

describe('filterArgs module', () => {

  it('empty args should return an object', (done) => {
    const emptyArgs = [];
    var args = filterArgs.parse(emptyArgs);
    expect(args).is.an('object');
    done();
  });

  it('empty filtered args should contain real dir', (done) => {
    const emptyArgs = [];
    var args = filterArgs.parse(emptyArgs);
    expect(args.dir).is.a('string');
    const isDir = help.filesys.directoryExists(args.dir);
    expect(isDir).to.eventually.equal(true);
    done();
  });

  it('empty filtered args should contain real conf file', done => {
    const emptyArgs = [];
    var args = filterArgs.parse(emptyArgs);
    expect(args.conf).is.a('string');
    const isFile = help.filesys.fileExists(args.conf);
    expect(isFile).to.eventually.equal(true);
    done();
  });
});
