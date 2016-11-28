const fs = require('fs');
const path = require('path');
const http = require('http');

const chai = require('chai');

const expect = chai.expect;

const argv = [null, null,
  // Use the Markconf file from this spec directory
  '-c', __dirname,
  // Turn off the logger
  // '-l', 'trace'
  // '-p', '8889',
  '-l', 'OFF'
];

describe('Markconf with HTML includer', () => {
  it('should be able to nest HTML levels deep', done => {
    require('app/markserv.js')(argv).then(markserv => {
      // console.log(markserv);

      // // should initialize
      expect(markserv.isInitialized).to.be.a('boolean');
      expect(markserv.isInitialized).to.equal(true);
      expect(markserv.Markconf).to.be.an('object');

      const expectedHtml = fs.readFileSync(path.join(__dirname, 'expected.html'), 'utf8');

      http.get('http://localhost:8889').on('response', res => {
        res.setEncoding('utf8');
        res.on('data', data => {
          // console.log(expectedHtml);
          expect(data).to.equal(expectedHtml);

          markserv.kill();

          done();
        });
      });
    });
  });
});
