const chaiAsPromised = require('chai-as-promised');
const chai = require('chai').use(chaiAsPromised);
const help = require('./spec/helpers/loadHelpers.js');
const expect = chai.expect;

const markserv = require('./markserv.js');

// beforeEach(() => {
//   loadHandlers.clearStack();
// });

describe('markserv main module', () => {

  it('can initialize core Markconf', () => {
    const cwd = process.cwd();

    const mockArgs = {
      dir: cwd,
      conf: cwd + '/Markconf.js',
    };

    const Markconf = require('./markconf').initialize(mockArgs);

    const result = markserv.initialize(Markconf);

    const expected = [
      'handlers',
      'includes',
      // 'name',
    ];

    return expect(result).to.eventually.contain.all.keys(...expected);
  });
});
