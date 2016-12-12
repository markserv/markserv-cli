const Promise = require('bluebird');

const argv = require('app/lib/core/argv');
const conf = require('app/lib/core/conf');
const resolver = require('app/lib/plugin/resolver');
const service = require('app/lib/core/service');

const initialize = args => new Promise((resolve, reject) => {
	const settings = argv(args);
	const config = conf(settings);

	return resolver(config)
	.then(service)
	.then(markserv => {
		// console.log('█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓');
		// console.log(markserv);
		// console.log('█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓');
		resolve(markserv);
	})
	// .then(resolve)
	.catch(reject);
});

const CLI = !module.parent.parent;

if (CLI) {
	initialize(process.argv);
}

module.exports = args => initialize(args);
