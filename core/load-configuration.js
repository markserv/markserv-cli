const args = require('./filter-args').parse(process.argv);
const Markconf = require('./markconf').initialize(args);

global.log.trace('\n' + JSON.stringify(Markconf) + '\n');

module.exports = Markconf;
