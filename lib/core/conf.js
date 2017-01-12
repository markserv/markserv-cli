const path = require('path');
const fs = require('fs');

const ops = require('app/lib/core/ops')();

module.exports = args => {
	const providedPath = path.resolve(args.MarkconfUrl.split('Markconf.js')[0]);
	const confDir = path.resolve(providedPath);

	let MarkconfUrl = path.join(confDir, 'Markconf.js');
	let MarkconfDir = path.dirname(MarkconfUrl);

	if (!fs.existsSync(MarkconfUrl)) {
		MarkconfDir = path.resolve(__dirname, '..', '..');
		MarkconfUrl = path.join(MarkconfDir, 'Markconf.js');
	}

	const MarkconfJs = require(MarkconfUrl);

	const InitialMarkconf = {
		// Internal object for internal opertaional flags set at runtime
		$ops: ops,

		// Arguments passed to the process from the cli or tests
		args,

		// Path to the Markconf.js file
		MarkconfDir,

		// FILE:URL of the Markconf.js
		MarkconfUrl,

		// The exported configuration from Markconf.js file
		MarkconfJs,

		// Loaded Defaults (can be overridden in conf)
		MarkconfDefaults: require(args.MarkconfDefaultsUrl),

		// ID of the process user can kill
		pid: process.pid,

		// Document root
		root: path.resolve(args.root)
	};

	return InitialMarkconf;
};
