const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
  // Use the Markconf file from this spec directory
  '-c', __dirname,
  // Turn off the logger
  '-l', 'ERROR'
];

describe('Markconf with modifier array containing strings', () => {

  it('should initialize', done => {
    const markserv = require('app/markserv.js')(argv);
    // console.log(markserv);

    // should initialize
    expect(markserv.isInitialized).to.be.a('boolean');
    expect(markserv.isInitialized).to.equal(true);

    // should have plugins modifiers object
    expect(markserv.Markconf).to.be.an('object');
    expect(markserv.Markconf.plugins).to.be.an('object');
    expect(markserv.Markconf.plugins.modifiers).to.be.an('object');

    // should have a modifiers pattern array
    expect(markserv.Markconf.plugins.modifiers['**/*.*']).to.be.an('array');
    expect(markserv.Markconf.plugins.modifiers['**/*.*'].length).to.be.greaterThan(1);

    // should load the modifier: `markserv-contrib-mod.file`
    const fileModifierA = markserv.Markconf.plugins.modifiers['**/*.*'][0];
    expect(fileModifierA.name).to.equal('markserv-contrib-mod.file');
    expect(fileModifierA.httpResponseModifier).to.be.a('function');

    // should load the modifier: `markserv-contrib-mod.dir`
    const fileModifierB = markserv.Markconf.plugins.modifiers['**/*.*'][1];
    expect(fileModifierB.name).to.equal('markserv-contrib-mod.dir');
    expect(fileModifierB.httpResponseModifier).to.be.a('function');

    markserv.kill();

    done();
  });
});
