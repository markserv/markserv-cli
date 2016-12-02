const path = require('path');

const initialize = args => {
	const providedPath = args.conf.split('Markconf.js')[0];
	const confDir = path.resolve(providedPath);
	const MarkconfDefinition = require(path.resolve(path.join(confDir, 'Markconf.js')));

	// I don't like how/where this is being declared
	const DefaultsDefinition = {defaults: args.defaults};

	const Runtime = {
		// Function to re-initialize the config
		initialize,

		// Arguments passed to the process
		args,

		// ID of the process, user can kill
		pid: process.pid,

		// URL of the running server
		url: 'http://' + args.address + ':' + args.port,

		// Path to the Markconf.js
		conf: path.resolve(providedPath) + '/Markconf.js',

		// Document root
		root: path.resolve(args.root)
	};

	// Combine objects to create Markconf
	const initialized = Object.assign(
	// CLI Args
	Runtime,

	// Re-initialization callback
	initialize,

	// Loaded Defaults (can be overridden in conf)
	DefaultsDefinition,

	// The loaded Markconf.js file
	MarkconfDefinition
	);

	// Write over the export
	module.exports = initialized;

	// logConfig(initialized);

	return initialized;
};

module.exports = {
	initialize
};
