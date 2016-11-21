const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
  // Use the Markconf file from this spec directory
  '-c', __dirname,
  // Turn off the logger
  '-l', 'OFF'
];

describe('Markconf with modifier array containing strings', () => {
  const markserv = require('app/markserv.js')(argv);
  // console.log(markserv);
  // console.log(markserv.Markconf.plugins.modifiers);

  it('should initialize', () => {
    expect(markserv.isInitialized).to.be.a('boolean');
    expect(markserv.isInitialized).to.equal(true);
  });

  it('should have plugins modifiers object', () => {
    expect(markserv.Markconf).to.be.an('object');
    expect(markserv.Markconf.plugins).to.be.an('object');
    expect(markserv.Markconf.plugins.modifiers).to.be.an('object');
  });

  it('should have a modifiers pattern array', () => {
    expect(markserv.Markconf.plugins.modifiers['**/*.*']).to.be.an('array');
    expect(markserv.Markconf.plugins.modifiers['**/*.*'].length).to.be.greaterThan(1);
  });

  it('should load the modifier: `markserv-contrib-mod.file`', () => {
    const fileModifier = markserv.Markconf.plugins.modifiers['**/*.*'][0];
    expect(fileModifier.name).to.equal('markserv-contrib-mod.file');
    expect(fileModifier.httpResponseModifier).to.be.a('function');
  });

  it('should load the modifier: `markserv-contrib-mod.dir`', () => {
    const fileModifier = markserv.Markconf.plugins.modifiers['**/*.*'][1];
    expect(fileModifier.name).to.equal('markserv-contrib-mod.dir');
    expect(fileModifier.httpResponseModifier).to.be.a('function');
  });

  markserv.kill();
});
