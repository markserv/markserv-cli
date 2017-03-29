const Promise = require('bluebird')

const argv = require('app/lib/core/argv')
const conf = require('app/lib/core/conf')
const resolver = require('app/lib/plugin/resolver')
const service = require('app/lib/core/service')

const initialize = (args, options) => new Promise((resolve, reject) => {
	const settings = argv(args || process.argv)
	const config = conf(settings)

	// Make initialize() available for loading sub-Markconf.js configurations
	config.initialize = initialize

	// Set the $ops.subconf flag so services like http dont start for sub-
	// configurations (we don't want 2 servers w/ a conf import)
	if (typeof options === 'object' && Reflect.has(options, 'parent')) {
		config.$ops.set('subconf', true)
	}

	return resolver(config)
	.then(service)
	.then(markserv => {
		// console.log(markserv)
		resolve(markserv)
	})
	.catch(reject)
})

module.exports = initialize
