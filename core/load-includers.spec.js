const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const help = require('./spec/helpers/load-helpers');
const loadIncludes = require('./load-includers');

global.log = help.logging;

chai.use(chaiAsPromised);
const expect = chai.expect;

loadIncludes.configure({
  path: process.cwd()
});

beforeEach(() => {
  loadIncludes.clearStack();
});

describe('loadIncludes module', () => {
  it('fails with empty include conf', () => {
    const emptyIncludesConf = {};
    const result = loadIncludes.load(emptyIncludesConf);
    const expected = [
      'Err: No includes provided'
    ];
    return expect(result).to.be.rejectedWith(expected);
  });

  it('fails loading a non-existent module', () => {
    const includesConf = {
      includename: 'this-module-should-never-exist'
    };
    const expected = [
      'Err: No includes provided',
      'Err: Could not load: "this-module-should-never-exist"'
    ];
    const result = loadIncludes.load(includesConf);
    return expect(result).to.be.rejectedWith(expected);
  });

  it('loads include processor from: node_modules', () => {
    const includesConf = {
      html: 'markserv-inc-html'
    };
    const includeStack = loadIncludes.load(includesConf);
    const expected = {
      html: {name: 'markserv-inc-html'}
    };
    return expect(includeStack).to.eventually.become(expected);
  });

  it('loads 2 include processors from: node_modules', () => {
    const includesConf = {
      html: 'markserv-inc-html',
      markdown: 'markserv-inc-markdown'
    };
    const includeStack = loadIncludes.load(includesConf);
    const expected = {
      html: {name: 'markserv-inc-html'},
      markdown: {name: 'markserv-inc-markdown'}
    };
    return expect(includeStack).to.eventually.become(expected);
  });

  it('loads include processor from: local module script directory', () => {
    const includesConf = {
      local: 'core/spec/mock/modules/markserv-inc-local'
    };
    const expected = {
      local: {name: 'markserv-inc-local'}
    };
    const includeStack = loadIncludes.load(includesConf);
    return expect(includeStack).to.eventually.become(expected);
  });

  it('loads include processor from: local module script .js file', () => {
    const includesConf = {
      local: 'core/spec/mock/modules/markserv-inc-local/index'
    };
    const expected = {
      local: {name: 'markserv-inc-local'}
    };
    const includeStack = loadIncludes.load(includesConf);
    return expect(includeStack).to.eventually.become(expected);
  });

  it('can clear the loaded stack', () => {
    const includesConf = {
      html: 'markserv-inc-html'
    };
    const expected = {};
    const includeStack = loadIncludes.load(includesConf).then(() => {
      loadIncludes.clearStack();
      return loadIncludes.stack;
    });
    return expect(includeStack).to.become(expected);
  });
});
