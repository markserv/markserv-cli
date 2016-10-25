const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const help = require('./spec/helpers/load-helpers');
const filterArgs = require('./init.args');

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('init.args module:', () => {
  it('empty args should return an object', done => {
    const emptyArgs = [];
    const args = filterArgs.parse(emptyArgs);
    expect(args).is.an('object');
    done();
  });

  it('args should contain real dir', done => {
    const emptyArgs = [];
    const args = filterArgs.parse(emptyArgs);
    expect(args.dir).is.a('string');
    const isDir = help.filesys.directoryExists(args.dir);
    expect(isDir).to.eventually.equal(true);
    done();
  });

  it('args should contain real conf file', done => {
    const emptyArgs = [];
    const args = filterArgs.parse(emptyArgs);
    expect(args.conf).is.a('string');
    const isFile = help.filesys.fileExists(args.conf);
    expect(isFile).to.eventually.equal(true);
    done();
  });
});
