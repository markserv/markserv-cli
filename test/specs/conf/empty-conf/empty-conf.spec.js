const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
// const help = require('./spec/helpers/load-helpers');
// const loadIncludes = require('./plugin.load-includers');

chai.use(chaiAsPromised);
// const expect = chai.expect;

// loadIncludes.configure({
//   path: process.cwd()
// });

// beforeEach(() => {
//   loadIncludes.clearStack();
// });

const markserv = require('app/index.js');

console.log(markserv);

// describe('empty conf module', () => {
//   it('fails', () => {
//     //
//   });
// });
