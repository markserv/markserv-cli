const Promise = require('bluebird');

const Markserv = require('app/lib/core/service');
const resolver = require('app/lib/plugin/resolver');

const initialize = args => new Promise((resolve, reject) => {
	const settings = require('app/lib/core/argv').parse(args);
	const Markconf = require('app/lib/core/markconf').initialize(settings);

	resolver(settings.conf, Markconf).then(plugins => {
		Markserv.spawnService(Markconf, plugins).then(service => {
			resolve(service);
		}).catch(err => {
			reject(err);
		});
	}).catch(reject);
});

const CLI = !module.parent.parent;

if (CLI) {
	initialize(process.argv);
}

module.exports = args => initialize(args);
