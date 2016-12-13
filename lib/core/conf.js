const path = require('path');
const ops = require('app/lib/core/ops')();

module.exports = args => {
	const providedPath = path.resolve(args.MarkconfUrl.split('Markconf.js')[0]);
	const confDir = path.resolve(providedPath);

	const InitialMarkconf = {
		// Internal object for internal opertaional flags set at runtime
		$ops: ops,

		// Arguments passed to the process from the cli or tests
		args,

		// FILE:URL of the Markconf.js
		MarkconfUrl: providedPath + '/Markconf.js',

		// Path to the Markconf.js file
		MarkconfDir: providedPath,

		// The exported configuration from Markconf.js file
		MarkconfJs: require(path.join(confDir, 'Markconf.js')),

		// Loaded Defaults (can be overridden in conf)
		MarkconfDefaults: require(args.MarkconfDefaultsUrl),

		// ID of the process user can kill
		pid: process.pid,

		// Document root
		root: path.resolve(args.root)
	};

	return InitialMarkconf;
};
