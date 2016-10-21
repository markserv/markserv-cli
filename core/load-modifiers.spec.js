const chaiAsPromised = require('chai-as-promised');
const chai = require('chai').use(chaiAsPromised);

const expect = chai.expect;

const loadHandlers = require('./load-handlers');

loadHandlers.configure({
  path: process.cwd()
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

  it('mods loaded from node_modules should contain: configure, Markconf, meta & httpResponseModifier', () => {
    const handlersConf = {
      dir: 'markserv-mod-dir'
    };
    const handlerStack = loadHandlers.load(handlersConf);
    return Promise.all([
      expect(handlerStack).to.eventually.have.deep.property('dir.configure'),
      expect(handlerStack).to.eventually.have.deep.property('dir.Markconf'),
      expect(handlerStack).to.eventually.have.deep.property('dir.meta'),
      expect(handlerStack).to.eventually.have.deep.property('dir.httpResponseModifier')
    ]);
  });

  it('loads markserv-mod-dir modifier from: node_modules', () => {
    const handlersConf = {
      dir: 'markserv-mod-dir'
    };
    const handlerStack = loadHandlers.load(handlersConf);
    return Promise.all([
      expect(handlerStack).to.eventually.have.deep.property('dir.meta.name', 'markserv-mod-dir')
    ]);
  });

  it('loads 2 handler processors from: node_modules', () => {
    const handlersConf = {
      dir: 'markserv-mod-dir',
      markdown: 'markserv-mod-markdown'
    };
    const handlerStack = loadHandlers.load(handlersConf);
    return Promise.all([
      expect(handlerStack).to.eventually.have.deep.property('dir.meta.name', 'markserv-mod-dir'),
      expect(handlerStack).to.eventually.have.deep.property('markdown.meta.name', 'markserv-mod-markdown')
    ]);
  });

  it('loads handler processor from: local module script directory', () => {
    const handlersConf = {
      local: 'core/spec/mock/modules/markserv-mod-local'
    };
    const handlerStack = loadHandlers.load(handlersConf);
    return Promise.all([
      expect(handlerStack).to.eventually.have.deep.property('local.meta.name', 'markserv-mod-local')
    ]);
  });

  it('mods loaded from local should contain: configure, Markconf, meta & httpResponseModifier', () => {
    const handlersConf = {
      local: 'core/spec/mock/modules/markserv-mod-local'
    };
    const handlerStack = loadHandlers.load(handlersConf);
    return Promise.all([
      expect(handlerStack).to.eventually.have.deep.property('local.configure'),
      expect(handlerStack).to.eventually.have.deep.property('local.Markconf'),
      expect(handlerStack).to.eventually.have.deep.property('local.meta'),
      expect(handlerStack).to.eventually.have.deep.property('local.httpResponseModifier')
    ]);
  });

  it('loads handler processor from: local module script .js file', () => {
    const handlersConf = {
      local: 'core/spec/mock/modules/markserv-mod-local/index'
    };
    const handlerStack = loadHandlers.load(handlersConf);
    return Promise.all([
      expect(handlerStack).to.eventually.have.deep.property('local.meta.name', 'index')
    ]);
  });

  it('can clear the loaded stack', () => {
    const handlersConf = {
      dir: 'markserv-mod-dir'
    };
    const expected = {};
    const handlerStack = loadHandlers.load(handlersConf).then(() => {
      loadHandlers.clearStack();
      return loadHandlers.stack;
    });
    return expect(handlerStack).to.become(expected);
  });
});
