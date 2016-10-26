const chaiAsPromised = require('chai-as-promised');
const chai = require('chai').use(chaiAsPromised);
// const help = require('./spec/helpers/load-helpers');
const markserv = require('./markserv.js');

const expect = chai.expect;

// beforeEach(() => {
//   loadHandlers.clearStack();
// });

describe('markserv main module', () => {
  it('can initialize core Markconf', () => {
    const cwd = process.cwd();

    const mockArgs = {
      dir: cwd,
      conf: cwd + '/Markconf.js',
      defaults: cwd + '/Markconf.Defaults.js'
    };

    const Markconf = require('./init.markconf').initialize(mockArgs);

    const result = markserv.initialize(Markconf);

    const expected = [
      'modifiers',
      'includes'
    ];

    return expect(result).to.eventually.contain.all.keys(...expected);
  });
});
