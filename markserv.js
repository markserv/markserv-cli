#!/usr/bin/env node
const init = require('app/lib/core/init.js')

Error.stackTraceLimit = 50

const CLI = !module.parent

if (CLI) {
	init(process.argv)
}

module.exports = init
