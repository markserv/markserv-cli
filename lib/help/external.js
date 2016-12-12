const log = require('app/lib/core/log');

module.exports = config => {
	const publicHelpers = {
		// File System
		readfile: config.helpers.fs.readfile,
		isMarkdownFile: config.helpers.fs.isMarkdownFile,
	};

	return publicHelpers;
};
