const Promise = require('bluebird');

const argv = require('app/lib/core/argv');
const conf = require('app/lib/core/conf');
const resolver = require('app/lib/plugin/resolver');
const service = require('app/lib/core/service');

const initialize = args => new Promise((resolve, reject) => {
	const settings = argv(args);
	const config = conf(settings);

	resolver(config)
	.then(service)
	.then(MARKSERV => {
		console.log('█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░▒▓');
		console.log(MARKSERV);
		resolve(MARKSERV);
	})
	// .then(resolve)
	.catch(reject);
});

const CLI = !module.parent.parent;

if (CLI) {
	initialize(process.argv);
}

module.exports = args => initialize(args);
