const chaiAsPromised = require('chai-as-promised');
const chai = require('chai').use(chaiAsPromised);
const help = require('./spec/helpers/loadHelpers.js');
const expect = chai.expect;

const loadHandlers = require('./loadHandlers.js');

loadHandlers.configure({
  path: process.cwd(),
});

beforeEach(() => {
  loadHandlers.clearStack();
});

describe('loadHandlers module', () => {

  it('fails with empty handler conf', () => {
    const emptyHandlersConf = {};
    const result = loadHandlers.load(emptyHandlersConf);
    const expected = [
      'Err: No handlers provided'
    ];
    return expect(result).to.be.rejectedWith(expected);
  });

  it('fails loading a non-existent module', () => {
    const handlersConf = {
      name: 'this-module-should-never-exist'
    };
    const expected = [
      'Err: No handlers provided',
      'Err: Could not load: "this-module-should-never-exist"'
    ];
    const result = loadHandlers.load(handlersConf);
    return expect(result).to.be.rejectedWith(expected);
  });

  it('loads handler processor from: node_modules', () => {
    const handlersConf = {
      dir: 'markserv-mod-dir',
    };
    const handlerStack = loadHandlers.load(handlersConf);
    const expected = {
      dir: { name: 'markserv-mod-dir' },
    };
    return expect(handlerStack).to.eventually.become(expected);
  });

  it('loads 2 handler processors from: node_modules', () => {
      const handlersConf = {
      dir: 'markserv-mod-dir',
      markdown: 'markserv-mod-markdown',
    };
    const handlerStack = loadHandlers.load(handlersConf);
    const expected = {
      dir: { name: 'markserv-mod-dir' },
      markdown: { name: 'markserv-mod-markdown' }
    };
    return expect(handlerStack).to.eventually.become(expected);
  });

  it('loads handler processor from: local module script directory', function () {
    const handlersConf = {
      local: 'core/spec/mock/modules/markserv-mod-local',
    };
    const expected = {
      local: { name: 'markserv-mod-local' }
    };
    const handlerStack = loadHandlers.load(handlersConf);
    return expect(handlerStack).to.eventually.become(expected);
  });

  it('loads handler processor from: local module script .js file', function () {
    const handlersConf = {
      local: 'core/spec/mock/modules/markserv-inc-local/index',
    };
    const expected = {
      local: { name: 'markserv-inc-local' }
    };
    const handlerStack = loadHandlers.load(handlersConf);
    return expect(handlerStack).to.eventually.become(expected);
  });

  it('can clear the loaded stack', () => {
    const handlersConf = {
      dir: 'markserv-mod-dir',
    };
    const expected = {};
    const handlerStack = loadHandlers.load(handlersConf).then(returnStack => {
      loadHandlers.clearStack();
      return loadHandlers.stack;
    });
    return expect(handlerStack).to.become(expected);
  });
});
