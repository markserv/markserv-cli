const path = require('path')
const fs = require('fs')

const ops = require('app/lib/core/ops')()
const log = require('app/lib/core/log')

module.exports = args => {
	const providedPath = path.resolve(path.dirname(args.MarkconfUrl))
	let providedConf = path.basename(args.MarkconfUrl)

	if (providedConf === '.') {
		providedConf = 'Markconf.js'
	}

	let MarkconfUrl = path.join(providedPath, providedConf)
	let MarkconfDir = path.dirname(MarkconfUrl)

	if (!fs.existsSync(MarkconfUrl)) {
		MarkconfDir = path.resolve(__dirname, '..', '..')
		MarkconfUrl = path.join(MarkconfDir, 'Markconf.js')
	}

	let relativeMarkconf = path.relative(MarkconfDir, MarkconfUrl)

	if (relativeMarkconf[0] !== '.' && relativeMarkconf[0] !== '/') {
		relativeMarkconf = './' + relativeMarkconf
	}

	log.info(log.hl('Using Markconf: ') + log.ul(relativeMarkconf))

	const MarkconfJs = require(MarkconfUrl)

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
	}

	return InitialMarkconf
}
