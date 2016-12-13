const Promise = require('bluebird');

const argv = require('app/lib/core/argv');
const conf = require('app/lib/core/conf');
const resolver = require('app/lib/plugin/resolver');
const service = require('app/lib/core/service');

const initialize = (args, options) => new Promise((resolve, reject) => {
	const settings = argv(args);
	const config = conf(settings);

	// Make initialize() available for loading sub-Markconf.js configurations
	config.initialize = module.exports;

	// Set the $ops.subconf flag so services like http dont start for sub-
	// configurations (we don't want 2 servers w/ a conf import)
	if (typeof options === 'object' && Reflect.has(options, 'subconf')) {
		config.$ops.set('subconf', options.subconf);
	}

	return resolver(config)
	.then(service)
	.then(resolve)
	.catch(reject);
});

module.exports = initialize;
