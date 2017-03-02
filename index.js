const init = require('app/lib/core/init.js');

const CLI = !module.parent;

if (CLI) {
	init(process.argv);
}

module.exports = init;
