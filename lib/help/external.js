const log = require('app/lib/core/log');

module.exports = config => {
	const publicHelpers = {
		// File System
		readfile: config.helpers.fs.readfile,
		isMarkdownFile: config.helpers.fs.isMarkdownFile,

		// Logging
		trace: log.trace,
		info: log.info,
		debug: log.debug,
		warn: log.warn,
		error: log.error,
		fatal: log.fatal
	};

	return publicHelpers;
};
