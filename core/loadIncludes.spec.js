const chaiAsPromised = require('chai-as-promised');
const chai = require('chai').use(chaiAsPromised);
const help = require('./test/helpers/loadHelpers.js');
const expect = chai.expect;

const includes = require('./loadIncludes');

includes.configure({
  path: process.cwd(),
});

beforeEach(() => {
  includes.clearStack();
});

describe('includes module', () => {

  it('fails with empty include conf', () => {
    const emptyIncludesConf = {};
    const result = includes.load(emptyIncludesConf);
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
    const result = includes.load(includesConf);
    return expect(result).to.be.rejectedWith(expected);
  });

  it('loads include processor from: node_modules', () => {
    const includesConf = {
      html: 'markserv-inc-html',
    };
    const includeStack = includes.load(includesConf);
    const expected = {
      html: { name: 'markserv-inc-html' },
    };
    return expect(includeStack).to.eventually.become(expected);
  });

  it('loads 2 include processors from: node_modules', () => {
      const includesConf = {
      html: 'markserv-inc-html',
      markdown: 'markserv-inc-markdown',
    };
    const includeStack = includes.load(includesConf);
    const expected = {
      html: { name: 'markserv-inc-html' },
      markdown: { name: 'markserv-inc-markdown' }
    };
    return expect(includeStack).to.eventually.become(expected);
  });

  it('loads include processor from: local module script directory', function () {
    const includesConf = {
      local: 'core/test/mock/includes/markserv-inc-local',
    };
    const expected = {
      local: { name: 'markserv-inc-local' }
    };
    const includeStack = includes.load(includesConf);
    return expect(includeStack).to.eventually.become(expected);
  });

  it('loads include processor from: local module script .js file', function () {
    const includesConf = {
      local: 'core/test/mock/includes/markserv-inc-local/index',
    };
    const expected = {
      local: { name: 'markserv-inc-local' }
    };
    const includeStack = includes.load(includesConf);
    return expect(includeStack).to.eventually.become(expected);
  });

  it('can clear the loaded stack', () => {
    const includesConf = {
      html: 'markserv-inc-html',
    };
    const expected = {};
    const includeStack = includes.load(includesConf).then(returnStack => {
      includes.clearStack();
      return includes.stack;
    });
    return expect(includeStack).to.become(expected);
  });
});
