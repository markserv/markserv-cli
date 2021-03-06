const path = require('path')
const fs = require('fs')

const ops = require('app/lib/core/ops')()
const log = require('app/lib/core/log')

const directoryExistsSync = path => {
	let exists

	try {
		const stat = fs.statSync(path)
		if (stat.isDirectory()) {
			exists = true
		}
	} catch (err) {
		exists = false
	}

	return exists
}

const fileExistsSync = path => {
	let exists

	try {
		const stat = fs.statSync(path)
		if (stat.isFile()) {
			exists = true
		}
	} catch (err) {
		exists = false
	}

	return exists
}

// const findHereUp = (url, file) => {
// 	console.log(t, url, file)

// 	const existsHere = fileExistsSync(url)
// 	console.log(existsHere)

// 	if (path === '/') {
// 		return false
// 	}

// 	if (existsHere) {
// 		return url
// 	}

// 	const nextPathUp = path.resolve(path.join(path.dirname(url), '..'), file)
// 	return findHereUp(nextPathUp, file)
// }

const resolveMarkconfPath = url => {
	const result = {}

	const isDirectory = directoryExistsSync(url)
	const isFile = fileExistsSync(url)

	if (isDirectory) {
		result.dir = path.resolve(url)
		result.file = 'Markconf.js'
	} else if (isFile) {
		result.dir = path.resolve(path.dirname(url))
		result.file = path.basename(url)
	}

	result.url = path.join(result.dir, result.file)

	// result.url = findHereUp(result.url, result.file)

	if (!fileExistsSync(result.url)) {
		result.dir = path.resolve(__dirname, '..', '..')
		result.file = 'Markconf.js'
	}
	result.url = path.join(result.dir, result.file)

	let relative = path.relative(process.cwd(), result.url)
	if (relative[0] !== '.' && relative[0] !== '/') {
		relative = './' + relative
	}
	result.relative = relative

	return result
}

module.exports = args => {
	const markconf = resolveMarkconfPath(args.MarkconfUrl)
	// console.log(markconf)
	// process.exit()

	log.info(log.hl('Using Markconf: ') + log.ul(markconf.relative))

	const MarkconfDir = markconf.dir
	const MarkconfUrl = markconf.url
	const MarkconfJs = require(markconf.url)

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
