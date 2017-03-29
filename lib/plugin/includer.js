const log = require('app/lib/core/log')

module.exports = config => props => {
	const [
		pluginName,
		pluginPath,
		pluginExports
	] = props

	log.trace(`Initialzing includer: ${log.ul(pluginPath)}.`)

	const exports = {}

	exports.name = pluginExports.name || pluginName
	exports.options = pluginExports.options

	exports.setOptions = newOpts => {
		log.trace(`Setting options for modifier: ${log.ul(pluginPath)} ${log.hl(pluginName)}.`)
		exports.options = newOpts
	}

	exports.configure = conf => new Promise(resolve => {
		log.trace(`Configuring includer ${log.hl(pluginName)}.`)
		config = conf

		exports.htmlCommentIncluder = pluginExports.plugin(pluginExports, config)

		if (!exports.htmlCommentIncluder) {
			const msg = `Could not configure includer: ${pluginName}.`
			log.error(msg)
			// return reject(msg)
			resolve(exports)
		}

		resolve(exports)
	})

	return exports
}
